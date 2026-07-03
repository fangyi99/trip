import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrip } from "../context/TripContext.jsx";
import { searchPlaces, retrievePlace } from "../services/mapbox.js";
import { BUDGETS, TRAVEL_STYLES } from "../data/tripOptions.js";

export default function JourneyPage() {
  const { trip, updateTrip } = useTrip();
  const navigate = useNavigate();

  const [query, setQuery] = useState(trip.destination?.name ?? "");
  const [suggestions, setSuggestions] = useState([]);

  async function handleQueryChange(value) {
    setQuery(value);
    if (value.length < 3) return setSuggestions([]);
    setSuggestions(await searchPlaces(value));
  }

  async function handleSelectDestination(suggestion) {
    const coords = await retrievePlace(suggestion.id);
    updateTrip({ destination: { name: suggestion.name, ...coords } });
    setQuery(suggestion.name);
    setSuggestions([]);
  }

  const canContinue = trip.destination && trip.days > 0;

  return (
    <div className="space-y-6">
      <section>
        <label className="block font-mono text-xs uppercase tracking-wider text-ink/60 mb-2">
          Where to?
        </label>
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search a city or region"
          className="w-full bg-white/70 border border-ink/15 rounded-lg px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-cover"
        />
        {suggestions.length > 0 && (
          <ul className="mt-2 border border-ink/10 rounded-lg divide-y divide-ink/10 bg-white/90 overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => handleSelectDestination(s)}
                  className="w-full text-left px-4 py-2 hover:bg-paper-shadow"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-ink/50">{s.address}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <label className="block font-mono text-xs uppercase tracking-wider text-ink/60 mb-2">
          How many days?
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={trip.days}
          onChange={(e) => updateTrip({ days: Number(e.target.value) })}
          className="w-24 bg-white/70 border border-ink/15 rounded-lg px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-cover"
        />
      </section>

      <OptionGroup
        label="Budget"
        options={BUDGETS}
        value={trip.budget}
        onChange={(value) => updateTrip({ budget: value })}
      />

      <OptionGroup
        label="Travel style"
        options={TRAVEL_STYLES}
        value={trip.travelStyle}
        onChange={(value) => updateTrip({ travelStyle: value })}
      />

      <button
        disabled={!canContinue}
        onClick={() => navigate("/sights")}
        className="w-full bg-cover text-paper font-display text-lg rounded-lg py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next chapter →
      </button>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <section>
      <p className="block font-mono text-xs uppercase tracking-wider text-ink/60 mb-2">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              "rounded-lg border px-2 py-3 text-sm text-left transition-colors",
              value === opt.value
                ? "border-cover bg-cover text-paper"
                : "border-ink/15 bg-white/60 hover:border-cover/50",
            ].join(" ")}
          >
            <span className="block font-medium">{opt.label}</span>
            <span
              className={`block text-[11px] mt-0.5 ${value === opt.value ? "text-paper/70" : "text-ink/50"}`}
            >
              {opt.hint}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
