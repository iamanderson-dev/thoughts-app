/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily:{
        cal: ['Cal Sans']
      },
    },
  },
  plugins: [require('daisyui')],
}

