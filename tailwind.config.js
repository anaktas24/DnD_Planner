/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"MedievalSharp"', 'Georgia', 'serif'],
      },
      colors: {
        parchment: {
          50: '#fdf8f0',
          100: '#f7ead8',
          200: '#edd5b0',
          300: '#e0b97d',
        },
        dungeon: {
          800: '#1a1410',
          900: '#0f0c09',
        },
      },
    },
  },
  plugins: [],
}
