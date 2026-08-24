/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        // Small phones drop the wordmark and other second-tier chrome.
        xs: "420px",

        // Stubby viewports, phone landscape, mostly.
        short: { raw: "(max-height: 560px)" },
      },
      colors: {
        abyss: "var(--ts-abyss)",
        deep: "var(--ts-deep)",
        canvas: "var(--ts-canvas)",
        surface: "var(--ts-surface)",
        raised: "var(--ts-raised)",
        sand: "var(--ts-sand)",
        "sand-card": "var(--ts-sand-card)",
        cream: "var(--ts-cream)",
        "cream-2": "var(--ts-cream-2)",
        "cream-3": "var(--ts-cream-3)",
        ink: "var(--ts-ink)",
        "ink-2": "var(--ts-ink-2)",
        teal: "var(--ts-teal)",
        magenta: "var(--ts-magenta)",
        rose: "var(--ts-rose)",
        coral: "var(--ts-coral)",
        "coral-2": "var(--ts-coral-2)",
        aqua: "var(--ts-aqua)",
      },
      fontFamily: {
        display: ["Sora", "Inter", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        xl: "var(--r-xl)",
      },
      maxWidth: {
        shell: "1800px",
        prose: "62ch",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
