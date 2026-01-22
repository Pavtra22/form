/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        // You can keep or remove these custom fonts depending on if you loaded them
        handwriting: ["'Patrick Hand'", "cursive"],
        display: ["'Bungee Spice'", "cursive"],
      },
    },
  },
  plugins: [],
}