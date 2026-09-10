import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#FFFBF9",
        ink: "#2A2430",
        rose: {
          50: "#FFF1F3",
          100: "#FFE1E6",
          400: "#FB7185",
          500: "#F43F5E",
          600: "#E11D48",
        },
        plum: {
          500: "#8B5CF6",
          600: "#7C3AED",
        },
        gold: {
          400: "#F5C542",
          500: "#E0AA1E",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(42,36,48,0.08)",
        cardHover: "0 12px 32px -8px rgba(42,36,48,0.16)",
      },
    },
  },
  plugins: [],
};
export default config;
