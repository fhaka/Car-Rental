/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bcd0ff",
          300: "#8fb0ff",
          400: "#5d87ff",
          500: "#3563f0",
          600: "#2547d6",
          700: "#1f39ac",
          800: "#1e328a",
          900: "#1d2e6e",
        },
        sidebar: {
          DEFAULT: "#12131a",
          hover: "#1c1e29",
        },
        surface: {
          DEFAULT: "#f4f6fb",
          card: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
