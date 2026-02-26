import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system colors from prototype
        background: {
          DEFAULT: "#080c14",
          card: "rgba(15,23,42,0.6)",
        },
        border: {
          DEFAULT: "#1e293b",
        },
        text: {
          primary: "#f1f5f9",
          secondary: "#94a3b8",
          muted: "#64748b",
        },
        primary: {
          DEFAULT: "#6366f1",
          light: "#818cf8",
          muted: "#a5b4fc",
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
