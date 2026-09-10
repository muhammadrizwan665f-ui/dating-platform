import type { Config } from "tailwindcss";

function v(name: string) {
  return `rgb(var(--${name}) / <alpha-value>)`;
}

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: v("base"),
        ink: v("ink"),
        rose: {
          50: v("rose-50"),
          100: v("rose-100"),
          400: v("rose-400"),
          500: v("rose-500"),
          600: v("rose-600"),
        },
        plum: {
          500: v("plum-500"),
          600: v("plum-600"),
        },
        gold: {
          400: v("gold-400"),
          500: v("gold-500"),
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
