/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens. Values live in index.css so the same class works in
        // both themes without duplicating every utility in the components.
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          strong: "rgb(var(--brand-strong) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        // The footer stays a deep, quiet band in both themes.
        footer: "rgb(var(--footer) / <alpha-value>)",
        footerInk: "rgb(var(--footer-ink) / <alpha-value>)",
      },
      fontFamily: {
        // Keep the existing class names; swap the actual typefaces underneath.
        sora: ["Fraunces", "Georgia", "serif"],
        inter: ["DM Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px rgb(var(--ink) / 0.05)",
      },
    },
  },
  plugins: [],
};
