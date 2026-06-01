import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "hsl(220 14% 98%)",
          dark: "hsl(220 13% 9%)",
        },
        surface: {
          DEFAULT: "hsl(0 0% 100%)",
          dark: "hsl(220 13% 13%)",
        },
        border: {
          DEFAULT: "hsl(220 13% 91%)",
          dark: "hsl(220 13% 22%)",
        },
        muted: {
          DEFAULT: "hsl(220 9% 46%)",
          dark: "hsl(220 9% 64%)",
        },
        brand: {
          50: "hsl(259 100% 97%)",
          100: "hsl(259 100% 93%)",
          200: "hsl(259 96% 86%)",
          300: "hsl(259 94% 77%)",
          400: "hsl(259 93% 66%)",
          500: "hsl(259 88% 58%)",
          600: "hsl(259 76% 50%)",
          700: "hsl(259 71% 42%)",
          800: "hsl(259 68% 35%)",
          900: "hsl(259 60% 28%)",
        },
        sofy: "hsl(340 82% 60%)",
        mamypoko: "hsl(200 95% 55%)",
        lifree: "hsl(280 70% 55%)",
        petcare: "hsl(30 95% 55%)",
        success: "hsl(142 76% 41%)",
        warning: "hsl(38 92% 50%)",
        danger: "hsl(0 84% 60%)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        soft: "0 1px 2px hsl(220 14% 10% / 0.04), 0 4px 12px hsl(220 14% 10% / 0.04)",
        pop: "0 8px 32px hsl(220 14% 10% / 0.10)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
