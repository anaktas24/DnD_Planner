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
          700: 'rgb(var(--dungeon-700) / <alpha-value>)',
          800: 'rgb(var(--dungeon-800) / <alpha-value>)',
          900: 'rgb(var(--dungeon-900) / <alpha-value>)',
        },
        theme: {
          100: 'rgb(var(--theme-100) / <alpha-value>)',
          200: 'rgb(var(--theme-200) / <alpha-value>)',
          300: 'rgb(var(--theme-300) / <alpha-value>)',
          400: 'rgb(var(--theme-400) / <alpha-value>)',
          500: 'rgb(var(--theme-500) / <alpha-value>)',
          600: 'rgb(var(--theme-600) / <alpha-value>)',
          700: 'rgb(var(--theme-700) / <alpha-value>)',
          800: 'rgb(var(--theme-800) / <alpha-value>)',
          900: 'rgb(var(--theme-900) / <alpha-value>)',
        },
        prose: {
          200: 'rgb(var(--prose-200) / <alpha-value>)',
          300: 'rgb(var(--prose-300) / <alpha-value>)',
          400: 'rgb(var(--prose-400) / <alpha-value>)',
          500: 'rgb(var(--prose-500) / <alpha-value>)',
          600: 'rgb(var(--prose-600) / <alpha-value>)',
          700: 'rgb(var(--prose-700) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
