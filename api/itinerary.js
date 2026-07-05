import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { destination, days, budget, travelStyle, wishlist, hotel } = req.body;

  const prompt = buildPrompt({
    destination,
    days,
    budget,
    travelStyle,
    wishlist,
    hotel,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", //swap to gpt-4o for better results
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

function buildPrompt({
  destination,
  days,
  budget,
  travelStyle,
  wishlist,
  hotel,
}) {
  const places = wishlist.map((p) => `- ${p.name} (${p.category})`).join("\n");

  return `You are planning a ${days}-day trip to ${destination.name}.

Traveler preferences:
- Budget: ${budget}
- Pace: ${travelStyle}
- Staying at: ${hotel.name}, ${hotel.address}

Places they specifically want to visit:
${places}

Write a day-by-day itinerary that fits these places in sensibly (grouped by
location where possible), respects the traveler's pace and budget, and starts
and ends each day near the hotel. Fill any gaps with your own suggestions that
match the destination and budget.

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
