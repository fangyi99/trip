import { useState } from "react";
import { useTrip } from "../context/TripContext.jsx";
import { generateItinerary } from "../services/ai.js";

// Step 4: Generates day-by-day plan from the selected hotel + wishlist using AI
export default function PlanPage() {
  const { trip, updateTrip } = useTrip();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const itinerary = await generateItinerary(trip);
      updateTrip({ itinerary });
    } catch (e) {
      console.error("Itinerary generation failed:", e);
      setError(
        "Couldn't write your itinerary right now. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  }

  function formatItineraryAsText(trip) {
    const lines = [`${trip.destination.name} — ${trip.days} day itinerary`, ""];

    trip.itinerary.days.forEach((day) => {
      lines.push(`Day ${day.day}: ${day.summary}`);
      day.blocks.forEach((block) => {
        lines.push(
          `  ${block.time}  ${block.title}${block.notes ? ` — ${block.notes}` : ""}`,
        );
      });
      lines.push("");
    });

    return lines.join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatItineraryAsText(trip));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  }

  if (!trip.selectedHotel) {
    return (
      <p className="text-ink/60 text-center py-10">
        Pick a hotel in the Stay chapter first.
      </p>
    );
  }

  // Compares what the current itinerary was generated from against trip's current state
  // NEVER auto-generates unless clicked manually
  const isStale =
    trip.itinerary &&
    (trip.itinerary.generatedFrom?.hotelId !== trip.selectedHotel?.id ||
      trip.itinerary.generatedFrom?.days !== trip.days ||
      trip.itinerary.generatedFrom?.wishlistSignature !==
        trip.wishlist
          .filter((i) => i.included)
          .map((i) => i.id)
          .sort()
          .join(","));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {!trip.itinerary ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-ink/60">
              Ready to write your {trip.days}-{trip.days === 1 ? "day" : "days"}{" "}
              {trip.destination.name} itinerary.
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-cover text-paper font-display text-lg rounded-lg px-6 py-3 disabled:opacity-50"
            >
              {loading ? "Writing itinerary…" : "Generate itinerary"}
            </button>
            {error && <p className="text-seal text-sm">{error}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {isStale && (
              <div className="bg-seal/10 border border-seal/30 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm text-seal">
                  Your trip details changed since this was generated — hit
                  regenerate to update it.
                </p>
              </div>
            )}
            <div className="space-y-6">
              {trip.itinerary.days.map((day) => (
                <section key={day.day}>
                  <p className="text-xs text-ink/50 italic mb-2">
                    {day.summary}
                  </p>

                  <div className="border border-ink/15 rounded-lg overflow-hidden">
                    <div className="bg-cover text-paper font-display text-sm px-3 py-2">
                      Day {day.day}
                    </div>

                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-paper-shadow/60">
                          <th className="text-left font-mono text-[11px] uppercase tracking-wide text-ink/60 px-3 py-2 w-16">
                            Time
                          </th>
                          <th className="text-left font-mono text-[11px] uppercase tracking-wide text-ink/60 px-3 py-2">
                            Activity
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {day.blocks.map((block, i) => (
                          <tr
                            key={i}
                            className="border-t border-ink/10 align-top"
                          >
                            <td className="font-mono text-xs text-cover px-3 py-2 whitespace-nowrap">
                              {block.time}
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium">{block.title}</p>
                              {block.notes && (
                                <p className="text-xs text-ink/50 mt-0.5">
                                  {block.notes}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      {trip.itinerary && (
        <button
          onClick={handleCopy}
          className="no-print mt-4 shrink-0 w-full border border-cover text-cover font-display text-lg rounded-lg py-3"
        >
          {copied ? "Copied!" : "Copy as text"}
        </button>
      )}

      {trip.itinerary && (
        <button
          onClick={() => updateTrip({ itinerary: null })}
          className="mt-4 shrink-0 w-full border border-cover text-cover font-display text-lg rounded-lg py-3"
        >
          Regenerate
        </button>
      )}
    </div>
  );
}
