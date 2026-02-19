import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        reading: ["var(--font-reading)", "Georgia", "ui-serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui"],
        logo: ["var(--font-logo)", "Georgia", "ui-serif"],
      },
    },
  },
  plugins: [typography],
} satisfies Config;