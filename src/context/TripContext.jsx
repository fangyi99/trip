import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "wayfarer-trip";

const emptyTrip = {
  destination: null, // { name, lng, lat }
  days: 3,
  budget: "mid", // "budget" | "mid" | "luxury"
  travelStyle: "balanced", // "relaxed" | "balanced" | "packed"
  wishlist: [], // [{ id, name, category, lng, lat }]
  hotels: [],
  selectedHotel: null,
  itinerary: null,
};

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...emptyTrip, ...JSON.parse(saved) } : emptyTrip;
    } catch {
      return emptyTrip;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  }, [trip]);

  const updateTrip = (patch) => setTrip((prev) => ({ ...prev, ...patch }));

  const addWishlistItem = (item) =>
    setTrip((prev) => ({
      ...prev,
      wishlist: [...prev.wishlist, { ...item, included: true }],
    }));

  const removeWishlistItem = (id) =>
    setTrip((prev) => ({
      ...prev,
      wishlist: prev.wishlist.filter((item) => item.id !== id),
    }));

  const toggleWishlistItem = (id) =>
    setTrip((prev) => ({
      ...prev,
      wishlist: prev.wishlist.map((item) =>
        item.id === id ? { ...item, included: !item.included } : item,
      ),
    }));

  const resetTrip = () => setTrip(emptyTrip);

  return (
    <TripContext.Provider
      value={{
        trip,
        updateTrip,
        addWishlistItem,
        removeWishlistItem,
        toggleWishlistItem,
        resetTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used inside a TripProvider");
  return ctx;
}
