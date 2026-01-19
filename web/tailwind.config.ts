import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "var(--background)",
        foreground: "var(--text)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "#ffffff",
        },
        "admin-primary": "var(--admin-primary)",
        "secondary-blue": "var(--admin-primary)",
        "brand-red": "#991b1e",
        "header-bg": "var(--admin-primary)",
        // Genoun LLC Brand Colors
        genoun: {
          green: "var(--primary)",
          "green-dark": "var(--primary)", // Should probably be a darkened version, but for now linking to primary
          "green-light": "var(--primary)",
          gold: "#FB9903",
          "gold-light": "#FCAD35",
          "gold-dark": "#D98102",
          black: "#1A1A1A",
          white: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        glass: {
          base: "rgba(11, 27, 70, 0.06)",
          stroke: "rgba(255, 255, 255, 0.35)",
          highlight: "rgba(255, 255, 255, 0.25)",
          text: "rgba(255, 255, 255, 0.95)",
        },
      },
      fontFamily: {
        sans: ["var(--font-gilroy)", "sans-serif"],
        gilroy: ["var(--font-gilroy)", "sans-serif"],
        cairo: ["var(--font-cairo)", "var(--font-gilroy)", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.5rem",
        "2xl": "1.75rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
        glass: "24px",
        "glass-sm": "18px",
        "glass-lg": "28px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glass-shimmer": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glass-shimmer": "glass-shimmer 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;
