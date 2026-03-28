/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f131c",
        panel: "rgba(27, 34, 48, 0.66)",
        electric: "#56ccf2",
        violet: "#8b7dff"
      },
      boxShadow: {
        glass: "0 10px 40px rgba(0,0,0,0.45)"
      },
      backdropBlur: {
        xs: "2px"
      }
    },
  },
  plugins: [],
};
