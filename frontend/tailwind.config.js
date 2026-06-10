/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        arbey: {
          50: '#f6f7f4',
          100: '#e8ebe3',
          200: '#d2d8c8',
          300: '#b3bda4',
          400: '#94a382',
          500: '#768866',
          600: '#5c6d50',
          700: '#495643',
          800: '#3c4638',
          900: '#333c30',
          950: '#1a1f17',
        },
        warm: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d8bd',
          300: '#e9bc91',
          400: '#de9860',
          500: '#d47b3f',
          600: '#c66434',
          700: '#a54f2d',
          800: '#84412a',
          900: '#6b3725',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
