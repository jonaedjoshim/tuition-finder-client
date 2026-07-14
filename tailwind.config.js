/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          DEFAULT: '#2D5BE3',
          dark: '#1E45C8',
          light: '#EAF0FD',
        },
        violet: {
          DEFAULT: '#7C3AED',
        },
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
