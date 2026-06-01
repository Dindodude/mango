import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mango: {
          50: "#fff9e6",
          100: "#fff0b8",
          300: "#ffd45f",
          500: "#f5a623",
          700: "#b9690d"
        },
        leaf: {
          50: "#f3f8ef",
          100: "#dcebd2",
          500: "#4f8f3a",
          700: "#2f5d27",
          900: "#183416"
        },
        coral: {
          50: "#fff2ed",
          500: "#e86f4c",
          700: "#b8442b"
        }
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 93, 39, 0.12)",
        lift: "0 14px 35px rgba(28, 38, 28, 0.10)",
        crisp: "0 1px 2px rgba(16, 24, 16, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
