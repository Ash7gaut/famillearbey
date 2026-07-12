/** @type {import('tailwindcss').Config} */
function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined ? `rgb(var(${variable}))` : `rgb(var(${variable}) / ${opacityValue})`;
}

module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: withOpacity('--cream-50'),
          100: withOpacity('--cream-100'),
          200: withOpacity('--cream-200'),
          300: withOpacity('--cream-300'),
          400: withOpacity('--cream-400'),
        },
        ink: {
          400: withOpacity('--ink-400'),
          500: withOpacity('--ink-500'),
          600: withOpacity('--ink-600'),
          700: withOpacity('--ink-700'),
          800: withOpacity('--ink-800'),
          900: withOpacity('--ink-900'),
        },
        arbey: {
          50: withOpacity('--arbey-50'),
          100: withOpacity('--arbey-100'),
          200: withOpacity('--arbey-200'),
          300: withOpacity('--arbey-300'),
          400: withOpacity('--arbey-400'),
          500: withOpacity('--arbey-500'),
          600: withOpacity('--arbey-600'),
          700: withOpacity('--arbey-700'),
          800: withOpacity('--arbey-800'),
          900: withOpacity('--arbey-900'),
          950: withOpacity('--arbey-950'),
        },
        warm: {
          50: withOpacity('--warm-50'),
          100: withOpacity('--warm-100'),
          200: withOpacity('--warm-200'),
          300: withOpacity('--warm-300'),
          400: withOpacity('--warm-400'),
          500: withOpacity('--warm-500'),
          600: withOpacity('--warm-600'),
          700: withOpacity('--warm-700'),
          800: withOpacity('--warm-800'),
          900: withOpacity('--warm-900'),
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
