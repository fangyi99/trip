/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF6EC",
        "paper-shadow": "#E8DCC4",
        cover: "#1F3B3A",
        "cover-dark": "#152827",
        gold: "#C9A24B",
        ink: "#2A241C",
        seal: "#A13D3D",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Literata", "serif"],
        mono: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        book: "0 25px 60px -15px rgba(21, 40, 39, 0.45)",
      },
    },
  },
  plugins: [],
};
