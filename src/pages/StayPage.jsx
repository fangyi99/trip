import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext.jsx";
import { findTopHotels, externalBookingLink } from "../services/mapbox.js";

export default function StayPage() {
  const { trip, updateTrip } = useTrip();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSearch() {
    setLoading(true);
    setError(null);
    try {
      const includedWishlist = trip.wishlist.filter((item) => item.included);
      const hotels = await findTopHotels(trip.destination, includedWishlist);
      updateTrip({ hotels });
    } catch (e) {
      console.error("Hotel search failed:", e);
      setError("Couldn't load hotels right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {trip.hotels.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-ink/60">
              We'll find top 3 hotels closest to the destinations in your
              wishlist.
            </p>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-cover text-paper font-display text-lg rounded-lg px-6 py-3 disabled:opacity-50"
            >
              {loading ? "Searching…" : "Find hotels"}
            </button>
            {error && <p className="text-seal text-sm">{error}</p>}
          </div>
        ) : (
          <ul className="space-y-3">
            {trip.hotels.map((hotel, index) => (
              <li
                key={hotel.id}
                className={[
                  "border rounded-lg px-4 py-3 cursor-pointer transition-colors",
                  trip.selectedHotel?.id === hotel.id
                    ? "border-cover bg-cover/5"
                    : "border-ink/10 bg-white/70 hover:border-cover/40",
                ].join(" ")}
                onClick={() => updateTrip({ selectedHotel: hotel })}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="font-display text-lg text-gold shrink-0 w-6 text-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{hotel.name}</p>
                      <p className="text-xs text-ink/50">{hotel.address}</p>
                    </div>
                  </div>
                  <a
                    href={externalBookingLink(hotel.name, hotel.address)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-mono uppercase tracking-wide text-seal shrink-0 hover:underline"
                  >
                    View details ↗
                  </a>
                </div>

                {hotel.distances?.length > 0 && (
                  <ul className="mt-2 pt-2 border-t border-ink/10 space-y-1 pl-9">
                    {hotel.distances.map((d) => (
                      <li key={d.name} className="flex justify-between text-xs">
                        <span className="text-ink/60">{d.name}</span>
                        <span className="font-mono text-cover">
                          {formatDistance(d.meters)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {trip.hotels.length > 0 && !trip.selectedHotel && (
        <p className="text-center text-xs text-ink/50 mt-3">
          Tap a hotel above to select it and continue.
        </p>
      )}

      <button
        disabled={!trip.selectedHotel}
        onClick={() => navigate("/plan")}
        className="mt-4 shrink-0 w-full bg-cover text-paper font-display text-lg rounded-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        Next chapter →
      </button>
    </div>
  );
}

function formatDistance(meters) {
  if (meters == null) return "Distance unknown";
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`;
}
