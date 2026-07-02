/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dbeafe",
          500: "#3b6dd8",
          600: "#2f56ac",
          700: "#274686",
        },
      },
    },
  },
  plugins: [],
};
