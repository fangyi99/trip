/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F3E7",
        "paper-shadow": "#E5DCC8",
        cover: "#1E2A4A",
        "cover-dark": "#131C33",
        gold: "#B8935A",
        ink: "#23283B",
        seal: "#8b2e3f",
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
