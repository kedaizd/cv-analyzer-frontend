// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // W tym miejscu powinny znaleźć się Twoje rozszerzenia motywu, takie jak animacje, kolory itp.
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}