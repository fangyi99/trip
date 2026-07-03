const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const SEARCH_URL = "https://api.mapbox.com/search/searchbox/v1";
const MATRIX_URL = "https://api.mapbox.com/directions-matrix/v1/mapbox/driving";

/**
 * Free-text search used on both the Journey (destination) and Sights
 * (attractions/restaurants) chapters. `proximity` biases results toward
 * an already-picked destination once one exists.
 */
export async function searchPlaces(query, proximity) {
  if (!query) return [];
  const params = new URLSearchParams({
    q: query,
    access_token: TOKEN,
    session_token: getSessionToken(),
    limit: "6",
  });
  if (proximity) params.set("proximity", `${proximity.lng},${proximity.lat}`);

  const res = await fetch(`${SEARCH_URL}/suggest?${params}`);
  if (!res.ok) throw new Error("Mapbox search failed");
  const data = await res.json();

  return (data.suggestions ?? []).map((s) => ({
    id: s.mapbox_id,
    name: s.name,
    category: s.poi_category?.[0] ?? s.feature_type,
    address: s.full_address ?? s.place_formatted,
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
  const [lng, lat] = feature.geometry.coordinates;
  return { lng, lat };
}

/**
 * Finds candidate hotels around the destination, then ranks the closest
 * five to the *centroid* of the destination + the user's wishlist, so
 * the hotel is convenient to everything they actually plan to do.
 */
export async function findTopHotels(destination, wishlist) {
  const anchor = centroid([destination, ...wishlist]);

  const params = new URLSearchParams({
    q: "hotel",
    access_token: TOKEN,
    session_token: getSessionToken(),
    proximity: `${anchor.lng},${anchor.lat}`,
    poi_category: "lodging",
    limit: "10",
  });
  const res = await fetch(`${SEARCH_URL}/suggest?${params}`);
  if (!res.ok) throw new Error("Mapbox hotel search failed");
  const data = await res.json();

  const candidates = await Promise.all(
    (data.suggestions ?? []).slice(0, 10).map(async (s) => {
      const coords = await retrievePlace(s.mapbox_id);
      return {
        id: s.mapbox_id,
        name: s.name,
        address: s.full_address,
        ...coords,
      };
    }),
  );

  const withDistance = await attachDistances(anchor, candidates);
  return withDistance
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 5);
}

/** Batches a Matrix API call so we get all distances in a single request. */
async function attachDistances(origin, places) {
  if (places.length === 0) return [];
  const coordString = [
    `${origin.lng},${origin.lat}`,
    ...places.map((p) => `${p.lng},${p.lat}`),
  ].join(";");

  const params = new URLSearchParams({
    access_token: TOKEN,
    sources: "0",
    annotations: "distance",
  });
  const res = await fetch(`${MATRIX_URL}/${coordString}?${params}`);
  if (!res.ok) throw new Error("Mapbox matrix request failed");
  const data = await res.json();
  const distances = data.distances?.[0] ?? [];

  return places.map((place, i) => ({
    ...place,
    distanceMeters: distances[i + 1] ?? null,
  }));
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
