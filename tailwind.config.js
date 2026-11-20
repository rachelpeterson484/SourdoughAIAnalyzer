/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bakery': {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#a18072',
          600: '#8a6a5c',
          700: '#73564a',
          800: '#5c443a',
          900: '#45332c',
        },
        'crust': {
          50: '#fdf9f3',
          100: '#faf0e6',
          200: '#f5e0cc',
          300: '#eec9a8',
          400: '#e5ad7d',
          500: '#d4a574',
          600: '#c8956c',
          700: '#b8865a',
          800: '#a06f4a',
          900: '#85593d',
        },
        'crumb': {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
        }
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
