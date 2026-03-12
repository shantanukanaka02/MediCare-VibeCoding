/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f8fafc",
        ink: "#0f172a",
        accent: "#0f766e",
        danger: "#b91c1c",
      },
    },
  },
  plugins: [],
};