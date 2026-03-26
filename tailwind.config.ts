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
        navy: {
          DEFAULT: '#0A1628',
          light: '#0F1D32',
          lighter: '#162440',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dim: '#F4F5F7',
        },
        accent: {
          malta: '#1B6B5A',
          saudi: '#C9A84C',
        },
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
