export async function generateItinerary(trip) {
  const res = await fetch("/api/itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      destination: trip.destination,
      days: trip.days,
      budget: trip.budget,
      travelStyle: trip.travelStyle,
      wishlist: trip.wishlist,
      hotel: trip.selectedHotel,
    }),
  });

  if (!res.ok) throw new Error("Itinerary generation failed");
  const itinerary = await res.json();

  return {
    ...itinerary,
    generatedFrom: {
      hotelId: trip.selectedHotel.id,
      wishlistSignature: trip.wishlist
        .filter((i) => i.included)
        .map((i) => i.id)
        .sort()
        .join(","),
      days: trip.days,
    },
  };
}
