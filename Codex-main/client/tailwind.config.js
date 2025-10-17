/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        satorp: {
          blue: '#1e40af',
          lightblue: '#3b82f6',
          darkblue: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}