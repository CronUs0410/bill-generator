/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#1e3a5f",
        accent: "#f97316",
        surface: "#f8fafc",
        ink: "#10233b",
      },
      boxShadow: {
        card: "0 20px 45px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

