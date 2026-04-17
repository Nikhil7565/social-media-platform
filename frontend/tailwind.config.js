/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(240 30% 4%)', // Deep space black
        primary: '#7c3aed', // Violet
        accent: '#38bdf8', // Cyan
        amber: '#f59e0b', // Streak color
        pinklike: '#ec4899', // Pink for likes
      },
    },
  },
  plugins: [],
}
