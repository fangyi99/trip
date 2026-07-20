const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1";
const MATRIX_URL = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving";

/**
 * Free-text place search
 * @param {string} query - user input
 * @param {{lng,lat}} [proximity] - biases results toward this point
 * @param {string} [types] - restricts result types
 * @param {string} [countryCode] - restricts results inside one country
 */
export async function searchPlaces(query, proximity, types, countryCode) {
  if (!query) return [];
  const params = new URLSearchParams({
    q: query,
    access_token: TOKEN,
    session_token: getSessionToken(),
    limit: "6",
  });
  if (proximity) params.set("proximity", `${proximity.lng},${proximity.lat}`);
  if (types) params.set("types", types);
  if (countryCode) params.set("country", countryCode);

  const res = await fetch(`${SEARCH_URL}/suggest?${params}`);
  if (!res.ok) throw new Error("Mapbox search failed");
  const data = await res.json();

  return (data.suggestions ?? []).map((s) => ({
    id: s.mapbox_id,
    name: s.name,
    category: s.poi_category?.[0] ?? s.feature_type,
    address: s.full_address ?? s.place_formatted,
    countryCode: s.context?.country?.country_code,
  }));
}

/** Get selected place's coordinates. */
export async function retrievePlace(mapboxId) {
  const params = new URLSearchParams({
    access_token: TOKEN,
    session_token: getSessionToken(),
  });
  const res = await fetch(`${SEARCH_URL}/retrieve/${mapboxId}?${params}`);
  if (!res.ok) throw new Error("Mapbox retrieve failed");
  const data = await res.json();

  const feature = data.features?.[0];
  if (!feature) {
    console.error("Mapbox retrieve returned no feature:", data);
    throw new Error("No location data returned for this place");
  }

  const [lng, lat] = feature.geometry.coordinates;
  return { lng, lat };
}

export function isValidCoords(coords) {
  return coords && Number.isFinite(coords.lng) && Number.isFinite(coords.lat);
}

/**
 * Finds the 3 hotels most convenient to the destination + the user's
 * included wishlist items, each annotated with its distance to every
 * wishlist item individually
 */

export async function findTopHotels(destination, wishlist) {
  const outlierIds = findGeographicOutliers(wishlist);
  const consistentWishlist = wishlist.filter((w) => !outlierIds.includes(w.id));
  const anchor =
    consistentWishlist.length > 0 ? centroid(consistentWishlist) : destination;

  const params = new URLSearchParams({
    q: "hotel",
    access_token: TOKEN,
    session_token: getSessionToken(),
    proximity: `${anchor.lng},${anchor.lat}`,
    poi_category: "lodging",
    limit: "10",
  });
  if (destination.countryCode) params.set("country", destination.countryCode);

  const box = boundingBox(
    consistentWishlist.length > 0 ? consistentWishlist : [destination],
  );
  if (box) params.set("bbox", box);

  const res = await fetch(`${SEARCH_URL}/suggest?${params}`);
  if (!res.ok) throw new Error("Mapbox hotel search failed");
  const data = await res.json();

  const candidates = [];
  for (const s of (data.suggestions ?? []).slice(0, 10)) {
    try {
      const coords = await retrievePlace(s.mapbox_id);
      candidates.push({
        id: s.mapbox_id,
        name: s.name,
        address: s.full_address,
        ...coords,
      });
    } catch (e) {
      // Some suggestions don't have retrievable geometry - skip that one
      // hotel rather than aborting the whole search over it.
      console.warn(`Skipping hotel "${s.name}" - no location data available`);
    }
  }

  const nearby = candidates.filter((c) => haversineKm(anchor, c) <= 30);
  if (nearby.length === 0) {
    throw new Error("No hotels found close to your destination");
  }

  // Distances shown to the user still cover the FULL wishlist, outliers
  // included - we only excluded them from anchor/search, not from display.
  const withDistances = await attachDistances(wishlist, nearby);

  return withDistances
    .map((hotel) => ({
      ...hotel,
      avgDistance: average(hotel.distances.map((d) => d.meters)),
    }))
    .sort((a, b) => a.avgDistance - b.avgDistance)
    .slice(0, 3);
}

/**
 * Returns ids of points whose nearest neighbor is implausibly far away.
 * Robust to a single bad point in a way centroid-distance isn't - one
 * outlier can drag a shared center far enough that every *good* point
 * looks far from it too. Nearest-neighbor distance doesn't have that
 * problem: a real cluster member always has some other point close by,
 * an outlier doesn't.
 */
export function findGeographicOutliers(points, maxNearestNeighborKm = 50) {
  if (points.length <= 1) return [];

  return points
    .filter((p) => {
      const nearestDistance = Math.min(
        ...points
          .filter((other) => other.id !== p.id)
          .map((other) => haversineKm(p, other)),
      );
      return nearestDistance > maxNearestNeighborKm;
    })
    .map((p) => p.id);
}

// Straight-line distance in km - cheap, client-side, no API cost. Used only
// as a sanity filter, not for the actual displayed distances (those come
// from the real driving-route Matrix API in attachDistances).
function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function boundingBox(points, paddingDegrees = 0.05) {
  const valid = points.filter(Boolean);
  if (valid.length === 0) return null;

  const lngs = valid.map((p) => p.lng);
  const lats = valid.map((p) => p.lat);

  const minLng = Math.min(...lngs) - paddingDegrees;
  const maxLng = Math.max(...lngs) + paddingDegrees;
  const minLat = Math.min(...lats) - paddingDegrees;
  const maxLat = Math.max(...lats) + paddingDegrees;

  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

async function attachDistances(wishlist, hotels) {
  if (hotels.length === 0 || wishlist.length === 0) {
    return hotels.map((h) => ({ ...h, distances: [] }));
  }

  const coordString = [
    ...hotels.map((h) => `${h.lng},${h.lat}`),
    ...wishlist.map((w) => `${w.lng},${w.lat}`),
  ].join(";");

  const sources = hotels.map((_, i) => i).join(";");
  const destinations = wishlist.map((_, i) => hotels.length + i).join(";");

  const params = new URLSearchParams({
    access_token: TOKEN,
    sources,
    destinations,
    annotations: "distance",
  });
  const res = await fetch(`${MATRIX_URL}/${coordString}?${params}`);
  if (!res.ok) throw new Error("Mapbox matrix request failed");
  const data = await res.json();

  return hotels.map((hotel, hotelIndex) => ({
    ...hotel,
    distances: wishlist.map((place, placeIndex) => ({
      name: place.name,
      meters: data.distances?.[hotelIndex]?.[placeIndex] ?? null,
    })),
  }));
}

function average(numbers) {
  const valid = numbers.filter((n) => n != null);
  return valid.length
    ? valid.reduce((sum, n) => sum + n, 0) / valid.length
    : Infinity;
}

function centroid(points) {
  const valid = points.filter(Boolean);
  const lng = valid.reduce((sum, p) => sum + p.lng, 0) / valid.length;
  const lat = valid.reduce((sum, p) => sum + p.lat, 0) / valid.length;
  return { lng, lat };
}

let sessionToken;
function getSessionToken() {
  if (!sessionToken) sessionToken = crypto.randomUUID();
  return sessionToken;
}

export function externalBookingLink(hotelName, address) {
  const query = encodeURIComponent(`${hotelName} ${address ?? ""}`);
  return `https://www.google.com/travel/search?q=${query}`;
}
