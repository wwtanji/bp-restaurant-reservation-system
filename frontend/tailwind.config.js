/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        ot: {
          red: '#2D333F',
          'red-dark': '#1A1F28',
          charade: '#2D333F',
          'pale-sky': '#6B7280',
          iron: '#E5E7EB',
          'athens-gray': '#F9FAFB',
          manatee: '#9CA3AF',
          teal: '#4B5563',
        },
      },
      maxWidth: {
        'ot': '1280px',
      },
      borderRadius: {
        'ot-card': '8px',
        'ot-btn': '4px',
      },
    },
  },
  plugins: [],
}
