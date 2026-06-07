import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#241610",
        clay: "#9c6048",
        gold: "#c69a5b",
        paper: "#f5e8d5",
        soft: "#fbf3e8",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Songti SC", "Noto Serif SC", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Avenir Next", "PingFang SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
