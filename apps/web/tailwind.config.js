/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#101820',
        sidebar: '#17232E',
        card: '#1C2B36',
        primary: '#00C89B',
        secondary: '#2684FF',
        warning: '#F5B942',
        danger: '#EF5350',
        surface: '#F4F7FA',
      },
    },
  },
  plugins: [],
}
