import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050816",
        panel: "#0f172a",
        glow: "#f43f5e",
        accent: "#38bdf8",
        mist: "#dbeafe",
      },
      boxShadow: {
        card: "0 20px 60px rgba(15, 23, 42, 0.35)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top, rgba(244,63,94,0.22), transparent 30%), radial-gradient(circle at 80% 20%, rgba(56,189,248,0.18), transparent 25%)",
      },
      fontFamily: {
        sans: ["Trebuchet MS", "Verdana", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
