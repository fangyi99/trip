import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext.jsx";
import {
  searchPlaces,
  retrievePlace,
  isValidCoords,
  findGeographicOutliers,
} from "../services/mapbox.js";

// Step 2: Build wishlist of attractions/restuarants, scoped to
// country picked from previous step
export default function SightsPage() {
  const { trip, addWishlistItem, removeWishlistItem, toggleWishlistItem } =
    useTrip();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [addError, setAddError] = useState(null);

  async function handleQueryChange(value) {
    setQuery(value);
    if (value.length < 3) return setSuggestions([]);
    setSuggestions(
      await searchPlaces(
        value,
        trip.destination,
        undefined,
        trip.destination.countryCode,
      ),
    );
  }

  async function handleAdd(suggestion) {
    try {
      const coords = await retrievePlace(suggestion.id);
      if (!isValidCoords(coords)) {
        setAddError(
          `Couldn't add "${suggestion.name}" — no location data available for this place.`,
        );
        return;
      }
      addWishlistItem({
        id: suggestion.id,
        name: suggestion.name,
        category: suggestion.category,
        ...coords,
      });
      setQuery("");
      setSuggestions([]);
      setAddError(null);
    } catch (e) {
      console.error("Failed to add place:", e);
      setAddError(
        `Couldn't add "${suggestion.name}" — no location data available for this place.`,
      );
    }
  }

  if (!trip.destination) {
    return <EmptyState onBack={() => navigate("/journey")} />;
  }

  const outlierIds = findGeographicOutliers(
    trip.wishlist.filter((i) => i.included),
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <section className="relative">
          <label className="block font-mono text-xs uppercase tracking-wider text-ink/60 mb-2">
            Add a place in {trip.destination.name}
          </label>
          <input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search attractions or restaurants"
            className="w-full bg-white/70 border border-ink/15 rounded-lg px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-cover"
          />
          {addError && <p className="text-seal text-xs mt-2">{addError}</p>}
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-20 mt-2 border border-ink/10 rounded-lg divide-y divide-ink/10 bg-white shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => handleAdd(s)}
                    className="w-full text-left px-4 py-2 hover:bg-paper-shadow"
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className="block text-xs text-ink/50">
                      {s.category}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="font-mono text-xs uppercase tracking-wider text-ink/60 mb-2">
            Your wishlist ({trip.wishlist.length})
          </p>
          {trip.wishlist.length === 0 ? (
            <p className="text-sm text-ink/50 italic">
              Nothing added yet — search above.
            </p>
          ) : (
            <ul className="space-y-2">
              {trip.wishlist.map((item) => {
                const isOutlier = item.included && outlierIds.includes(item.id);
                return (
                  <li
                    key={item.id}
                    className={[
                      "flex items-center gap-3 border rounded-lg px-4 py-2.5",
                      isOutlier
                        ? "bg-seal/5 border-seal/40"
                        : "bg-white/70 border-ink/10",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={item.included}
                      onChange={() => toggleWishlistItem(item.id)}
                      className="w-4 h-4 accent-cover shrink-0"
                    />
                    <div
                      className={`flex-1 ${item.included ? "" : "opacity-40"}`}
                    >
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-ink/50">{item.category}</p>
                      {isOutlier && (
                        <p className="text-xs text-seal mt-0.5">
                          This looks far from your other places — double check
                          it's the right one.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeWishlistItem(item.id)}
                      className="text-seal text-xs font-mono uppercase tracking-wide hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <button
        disabled={trip.wishlist.length === 0}
        onClick={() => navigate("/stay")}
        className="sticky bottom-0 w-full bg-cover text-paper font-display text-lg rounded-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        Next chapter →
      </button>
    </div>
  );
}

function EmptyState({ onBack }) {
  return (
    <div className="text-center py-10">
      <p className="text-ink/60 mb-4">
        Pick a destination first so we know where to search.
      </p>
      <button onClick={onBack} className="text-cover underline font-medium">
        ← Back to Journey
      </button>
    </div>
  );
}
