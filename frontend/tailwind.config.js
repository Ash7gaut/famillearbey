/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F5F0E8',
          300: '#EDE6DA',
          400: '#E0D5C4',
        },
        ink: {
          400: '#9A8B7A',
          500: '#7A6B5C',
          600: '#5C4F42',
          700: '#4A3F35',
          800: '#2C2419',
          900: '#1F1A14',
        },
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
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        warm: '0 4px 20px -4px rgba(44, 36, 25, 0.08)',
        'warm-md': '0 8px 30px -6px rgba(44, 36, 25, 0.12)',
      },
    },
  },
  plugins: [],
};
