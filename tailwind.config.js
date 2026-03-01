/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "rgba(255,255,255,0.03)",
          bright: "rgba(255,255,255,0.05)",
          hover: "rgba(255,255,255,0.07)",
        },
        green: {
          sim: "#34d399",
          "sim-dim": "rgba(52,211,153,0.15)",
          "sim-border": "rgba(52,211,153,0.3)",
        },
        red: {
          sim: "#f87171",
          "sim-dim": "rgba(248,113,113,0.15)",
          "sim-border": "rgba(248,113,113,0.3)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          bright: "rgba(255,255,255,0.12)",
        },
        muted: "#64748b",
        subtle: "#94a3b8",
      },
      backgroundImage: {
        "app-gradient": "linear-gradient(135deg, #0a0e1a 0%, #0d1525 40%, #0a1628 70%, #060d1a 100%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
      },
      backdropBlur: {
        glass: "20px",
      },
      animation: {
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
        "ticker": "ticker 30s linear infinite",
        "fade-up": "fadeUp 0.3s ease",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
