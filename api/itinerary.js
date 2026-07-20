import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { destination, days, budget, travelStyle, wishlist, hotel } = req.body;

  // Geographic clustering happens here, in code, NOT left to the AI.
  // LLMs are unreliable at spatial optimization from place names alone -
  // they have no real distance data, just fuzzy world-knowledge guesses.
  // Doing this deterministically guarantees each day's places are actually
  // close together and visited in a sensible order, with zero chance of
  // the AI inventing a route that backtracks across the city.
  const dayPlans = planRoute(hotel, wishlist, days);

  const prompt = buildPrompt({
    destination,
    budget,
    travelStyle,
    hotel,
    dayPlans,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const itinerary = JSON.parse(text);

    return res.status(200).json(itinerary);
  } catch (err) {
    console.error("Itinerary generation error:", err);
    return res.status(500).json({ error: "Failed to generate itinerary" });
  }
}

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

// Groups points into `k` clusters by actual geographic proximity - unlike
// angular sweep, this considers real distance, not just direction from the
// hotel. Fixes cases where a nearby point and a far point share a similar
// angle and would otherwise get wrongly bundled into the same day.
function kMeansCluster(points, k, iterations = 20) {
  if (points.length <= k) return points.map((p) => [p]);

  // Seed centroids from k evenly-spaced points rather than random picks,
  // for deterministic, repeatable output on every generation.
  let centroids = points
    .filter((_, i) => i % Math.ceil(points.length / k) === 0)
    .slice(0, k)
    .map((p) => ({ lat: p.lat, lng: p.lng }));

  let assignments = points.map(() => 0);

  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;

    // Assign each point to its nearest centroid
    points.forEach((point, i) => {
      let bestCluster = 0;
      let bestDist = Infinity;
      centroids.forEach((c, ci) => {
        const d = haversineKm(point, c);
        if (d < bestDist) {
          bestDist = d;
          bestCluster = ci;
        }
      });
      if (assignments[i] !== bestCluster) changed = true;
      assignments[i] = bestCluster;
    });

    if (!changed && iter > 0) break;

    // Recompute each centroid as the average of its assigned points
    centroids = centroids.map((_, ci) => {
      const members = points.filter((_, i) => assignments[i] === ci);
      if (members.length === 0) return centroids[ci];
      return {
        lat: members.reduce((sum, p) => sum + p.lat, 0) / members.length,
        lng: members.reduce((sum, p) => sum + p.lng, 0) / members.length,
      };
    });
  }

  const clusters = Array.from({ length: k }, () => []);
  points.forEach((point, i) => clusters[assignments[i]].push(point));
  return clusters;
}

function nearestNeighborTour(start, points) {
  const remaining = [...points];
  const tour = [];
  let current = start;
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversineKm(current, p);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIndex = i;
      }
    });
    current = remaining.splice(nearestIndex, 1)[0];
    tour.push(current);
  }
  return tour;
}

function totalDistance(route) {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++)
    d += haversineKm(route[i], route[i + 1]);
  return d;
}

// Classic 2-opt local-search improvement: repeatedly tries reversing
// segments of the route and keeps the reversal if it shortens the total
// path. This is what fixes nearest-neighbor's "straggler point causes a
// backtrack" problem - cheap to run for the handful of points in a day.
function twoOptImprove(route) {
  let best = route;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 2; i++) {
      for (let j = i + 1; j < best.length - 1; j++) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        if (totalDistance(candidate) < totalDistance(best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
}

// Each day is now its own independent route starting from the hotel -
// not a slice of one long multi-day tour - then locally optimized with 2-opt.
function planRoute(hotel, wishlist, days) {
  const dayGroups = kMeansCluster(wishlist, days);

  return dayGroups.map((points) => {
    if (points.length <= 1) return points;
    const greedyTour = nearestNeighborTour(hotel, points);
    const improved = twoOptImprove([hotel, ...greedyTour]);
    return improved.slice(1);
  });
}

// ---- Prompt building - the AI only narrates an already-solved route ----

function buildPrompt({ destination, budget, travelStyle, hotel, dayPlans }) {
  const dayDescriptions = dayPlans
    .map((places, i) => {
      const list = places.length
        ? places.map((p) => `  - ${p.name} (${p.category})`).join("\n")
        : "  (no specific places assigned - suggest something fitting nearby)";
      return `Day ${i + 1}, visit in this order:\n${list}`;
    })
    .join("\n\n");

  return `You are writing a travel itinerary for a trip to ${destination.name}.

Traveler preferences:
- Budget: ${budget}
- Pace: ${travelStyle}
- Staying at: ${hotel.name}, ${hotel.address}

The places listed below for each day have already been route-optimized by
distance - DO NOT reorder them or move them to a different day. Your job is
to build a full day around them: assign sensible times, write brief notes,
and fill in the rest of each day with your own suggestions that fit
naturally near these fixed places - meals, a coffee break, a short walk, an
evening activity, etc. Match the traveler's pace (more filler for a
"packed" pace, less for "relaxed") and budget (free/cheap options for
"budget", nicer picks for "luxury"). Add a one-sentence summary per day.

${dayDescriptions}

Respond with ONLY valid JSON in exactly this shape:

{
  "days": [
    {
      "day": 1,
      "summary": "one sentence describing the day's theme",
      "blocks": [
        { "time": "09:00", "title": "Activity name", "notes": "brief context or tip" }
      ]
    }
  ]
}`;
}
