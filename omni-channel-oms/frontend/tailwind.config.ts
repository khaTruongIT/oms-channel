import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Omni Channel OMS - Pro Max Palette
        primary: {
          DEFAULT: "#4F46E5", // Indigo 600
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        secondary: {
          DEFAULT: "#111827", // Gray 900 for Sidebar
          50: "#F9FAFB",
          100: "#F3F4F6", // Background
          200: "#E5E7EB", // Border
          300: "#D1D5DB",
          400: "#9CA3AF", // Muted
          500: "#6B7280", // Body
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        success: {
          DEFAULT: "#059669",
          light: "#ECFDF5",
          dark: "#047857",
        },
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEF2F2",
          dark: "#B91C1C",
        },
        warning: {
          DEFAULT: "#D97706",
          light: "#FFFBEB",
          dark: "#B45309",
        },
        info: {
          DEFAULT: "#2563EB",
          light: "#EFF6FF",
          dark: "#1D4ED8",
        },
        // Semantic Roles
        heading: "#111827",
        body: "#4B5563",
        muted: "#9CA3AF",
        background: "#F3F4F6",
        surface: "#FFFFFF",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      spacing: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
        "3xl": "4rem",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        card: "0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)",
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(to right, #4F46E5, #4338CA)",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },
  plugins: [],
};

export default config;
