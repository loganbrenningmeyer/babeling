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
        reading: ["var(--font-lora)", "Georgia", "ui-serif"],
        ui: ["var(--font-dm_sans)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [typography],
} satisfies Config;