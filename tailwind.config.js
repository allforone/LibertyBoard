/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'board': '#DCA858',
        'board-lines': '#000000',
        'black-stone': '#000000',
        'white-stone': '#FFFFFF',
        'territory-black': 'rgba(0, 0, 0, 0.3)',
        'territory-white': 'rgba(255, 255, 255, 0.5)',
      }
    },
  },
  plugins: [],
}