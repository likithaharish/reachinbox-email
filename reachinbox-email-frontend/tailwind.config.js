/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fh: {
          green: "#71a070",
          "green-light": "#8FBF9F",
          "green-dark": "#2F6B57",
          "green-deep": "#21503b",
          teal: "#375553",
          navy: "#092b28",
          hero: "#052724",
          heading: "#2b2f38",
          body: "#48505e",
          muted: "#6B7280",
          dim: "#667085",
          border: "#d0d3d9",
          "border-light": "#E5E7EB",
          card: "#f3f5f4",
          white: "#ffffff",
          danger: "#bc0e41",
        },
        outbox: {
          black: "#f3f5f4",
          surface: "#ffffff",
          card: "#ffffff",
          elevated: "#f3f5f4",
          border: "#d0d3d9",
          "border-strong": "#71a070",
          muted: "#48505e",
          dim: "#6B7280",
          text: "#2b2f38",
          accent: "#71a070",
          highlight: "#8FBF9F",
        },
        accent: {
          violet: "#71a070",
          "violet-deep": "#2F6B57",
          cyan: "#8FBF9F",
          "cyan-deep": "#375553",
          emerald: "#2F6B57",
          pink: "#bc0e41",
        },
      },
      fontFamily: {
        sans: ["General Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["General Sans", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        outbox: "0 4px 20px rgba(0,0,0,0.08)",
        glow: "0 8px 24px rgba(113,160,112,0.18)",
        "glow-cyan": "0 8px 24px rgba(143,191,159,0.18)",
        card: "0 4px 20px rgba(0,0,0,0.06)",
        "inner-glow": "none",
      },
      backgroundImage: {
        "accent-mesh": "none",
        "outbox-grid": "none",
        "gradient-text": "none",
        "btn-primary": "none",
        "btn-accent": "none",
        "fh-hero": "linear-gradient(180deg, rgba(5, 39, 36, 0.55) 0%, rgba(5, 39, 36, 0.92) 100%)",
      },
      backgroundSize: {
        grid: "56px 56px",
      },
      borderRadius: {
        fh: "12px",
        "fh-lg": "20px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        "float-delayed": "float 8s ease-in-out 2s infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        "gradient-shift": "gradientShift 6s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [],
};
