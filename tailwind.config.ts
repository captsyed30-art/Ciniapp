import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#080c14",
        foreground: "#f8fafc",
        card: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
          elevated: "#182238",
        },
        cinema: {
          rose: "#e11d48",
          "rose-glow": "#fb7185",
          crimson: "#be123c",
          gold: "#f59e0b",
          "gold-glow": "#fcd34d",
          navy: "#0a0f1d",
          cyan: "#06b6d4",
          screen: "#38bdf8",
        },
        seat: {
          available: "#1e293b",
          "available-border": "#475569",
          selected: "#e11d48",
          held: "#f59e0b",
          booked: "#334155",
          vip: "#8b5cf6",
          couple: "#ec4899",
          accessible: "#0284c7",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinema-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(225, 29, 72, 0.25), rgba(255, 255, 255, 0))",
        "gold-glow": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245, 158, 11, 0.2), rgba(255, 255, 255, 0))",
        "screen-beam": "linear-gradient(180deg, rgba(56, 189, 248, 0.3) 0%, rgba(56, 189, 248, 0.02) 60%, transparent 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "beam-shimmer": "shimmer 2.5s infinite linear",
        "pop": "pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pop: {
          "0%": { transform: "scale(0.92)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
