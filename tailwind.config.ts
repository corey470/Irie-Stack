import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Workspace canvases (warm cream, never pure white)
        "bg-primary": "#f0ebe2",
        "bg-surface": "#ffffff",
        "bg-elevated": "#f7f4ef",
        "bg-hover": "#ede8df",
        "bg-active": "#e5e0d8",
        "bg-sidebar": "#faf7f2",

        // Marketing canvas (slightly brighter cream)
        "bg-marketing": "#faf7f2",
        "bg-marketing-deep": "#f1ece2",

        // Text tiers
        "text-primary": "#1a1a1a",
        "text-secondary": "#5b5a55",
        "text-muted": "#8c8c8c",
        "text-faint": "#c9c2b4",

        // Brand gold (universal accent — do not override)
        accent: {
          DEFAULT: "#c9a84c",
          light: "#e8c96a",
          deep: "#a68838",
        },

        // Borders (warm-tinted)
        border: {
          DEFAULT: "#e5e0d8",
          subtle: "#f1ece2",
          hover: "#d6cec2",
          strong: "#a68838",
        },

        // Functional state colors (do not use decoratively)
        success: { DEFAULT: "#22c55e", hover: "#16a34a" },
        warning: { DEFAULT: "#d97706" },
        destructive: { DEFAULT: "#dc2626" },
        info: { DEFAULT: "#2563eb" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Flat-plus-ring elevation (DESIGN.md §6)
        card: "0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)",
        "card-hover":
          "0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
        topbar: "0 1px 0 0 rgba(0,0,0,0.08)",
        sidebar: "1px 0 0 0 rgba(0,0,0,0.08)",
        dropdown:
          "0 8px 24px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        modal:
          "0 20px 48px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.08)",
        "gold-glow":
          "0 0 0 4px rgba(201, 168, 76, 0.15), 0 0 0 8px rgba(201, 168, 76, 0.08)",
      },
      borderRadius: {
        micro: "4px",
      },
      keyframes: {
        "cta-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 0 rgba(201, 168, 76, 0.45), 0 0 0 0 rgba(201, 168, 76, 0.15)",
          },
          "50%": {
            boxShadow:
              "0 0 0 6px rgba(201, 168, 76, 0.0), 0 0 0 12px rgba(201, 168, 76, 0.0)",
          },
        },
        "reveal-in": {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "cta-pulse": "cta-pulse 2.8s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "reveal-in":
          "reveal-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
      transitionTimingFunction: {
        "irie-decay": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
