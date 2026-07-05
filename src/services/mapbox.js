const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1";
const MATRIX_URL = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving";

/**
 * Free-text search used on both the Journey (destination) and Sights
 * (attractions/restaurants) chapters. `proximity` biases results toward
 * an already-picked destination once one exists.
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

/** Resolves a suggestion id (from searchPlaces) into real coordinates. */
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
 * Finds candidate hotels around the destination, then returns the 5 closest
 * to the *average* location of the wishlist (for ranking), each annotated
 * with its individual distance to every wishlist item (for display).
 */
export async function findTopHotels(destination, wishlist) {
  const anchor = centroid([destination, ...wishlist]);

  const params = new URLSearchParams({
    q: "hotel",
    access_token: TOKEN,
    session_token: getSessionToken(),
    proximity: `${anchor.lng},${anchor.lat}`,
    poi_category: "lodging",
    limit: "6",
  });
  const res = await fetch(`${SEARCH_URL}/suggest?${params}`);
  if (!res.ok) throw new Error("Mapbox hotel search failed");
  const data = await res.json();

  const candidates = await Promise.all(
    (data.suggestions ?? []).slice(0, 6).map(async (s) => {
      const coords = await retrievePlace(s.mapbox_id);
      return {
        id: s.mapbox_id,
        name: s.name,
        address: s.full_address,
        ...coords,
      };
    }),
  );

  const withDistances = await attachDistances(wishlist, candidates);

  // rank by average distance across the wishlist, so the top 5 are
  // genuinely the most convenient overall, not just closest to one spot
  return withDistances
    .map((hotel) => ({
      ...hotel,
      avgDistance: average(hotel.distances.map((d) => d.meters)),
    }))
    .sort((a, b) => a.avgDistance - b.avgDistance)
    .slice(0, 3);
}

/**
 * One Matrix API call per hotel batch, each hotel as a source and every
 * wishlist item as a destination - gives a full distance grid in one request.
 */
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

/** Mapbox bills search sessions, not individual keystrokes - reuse one id per search flow. */
let sessionToken;
function getSessionToken() {
  if (!sessionToken) sessionToken = crypto.randomUUID();
  return sessionToken;
}

/** Builds a "search this hotel" link since free tiers don't expose pricing. */
export function externalBookingLink(hotelName, address) {
  const query = encodeURIComponent(`${hotelName} ${address ?? ""}`);
  return `https://www.google.com/travel/search?q=${query}`;
}
