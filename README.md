<p align="justify">

# Trace: Intelligent Routes

An elegant, mobile-first web application designed to simplify travel planning. By combining smart accommodation recommendations with AI-driven itinerary generation, it transforms chaotic planning process into a beautiful, cohesive journey.

## Screenshots
<table width="100%">
  <tbody>
    <tr>
      <td width="1%"><a href="https://ibb.co/wRzGVrQ"><img src="https://i.ibb.co/DHSpLn3N/Screenshot-2026-07-12-175916.png" alt="Step 1: Journey" border="0"></a></td>
       <td width="1%"><a href="https://ibb.co/kxg8Hsq"><img src="https://i.ibb.co/cc8kLfdS/Screenshot-2026-07-12-175929.png" alt="Step 2: Sites" border="0"></a></td>
       <td width="1%"><a href="https://ibb.co/41nmX05"><img src="https://i.ibb.co/N6WQGbrv/Screenshot-2026-07-12-175943.png" alt="Step 3: Stay" border="0"></a></td>
       <td width="1%"><a href="https://ibb.co/2dbXTnp"><img src="https://i.ibb.co/tT8VLyzH/Screenshot-2026-07-12-180031.png" alt="Step 4: Plan" border="0"></a></td>
    </tr>
  </tbody>
</table>

## Features
* **Tailored Trip Setup:** Input your destination, trip duration, budget, and travel style to establish the backbone of your journey
* **Custom Point-of-Interest (POI) Pinning:** Search and add must-visit attractions or restaurants dynamically using the Mapbox Search API
* **Proximity-Based Hotel Discovery:** Automatically pulls the top 3 accommodations around your destination, complete with accurate distance calculations via the Mapbox Distance API
* **Seamless Booking Redirection:** Direct external links next to each hotel name route users to Google or Booking.com for real-time pricing and instant reservation
* **Smart Route Architect:** Once an accommodation is locked in, a tailored, location-optimized itinerary is generated based on your selected hotel, budget, and chosen sights
* **Simple UX:** Seamlessly flip between steps using the interactive right-hand vertical tabs: **Journey**, **Sights**, **Stay**, and **Plan**

## Tech Stack
- [React](https://react.dev/)
- [Mapbox](https://www.mapbox.com/)
- [OpenAI API](https://openai.com/index/openai-api/)

## Getting Started
### Prerequisites

Before running the project locally, ensure you have the following API keys ready:

- Mapbox API Key
- OpenAI API Key

### Installation

1. Clone the repository:
         git clone https://github.com/fangyi99/trip.git

2. Install dependencies:

         npm install

3. Create a .env file in the root directory and add your environment variables:

         VITE_MAPBOX_TOKEN=your_mapbox_token_here
         OPENAI_API_KEY=your_ai_api_key_here

4. Start the development server:
         npm run dev:full


## Credits
- [LottieFiles](https://lottiefiles.com/free-animation/traveller-h1uvfZOMew)

</p>
