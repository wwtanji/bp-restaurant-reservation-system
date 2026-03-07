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
          primary: '#4F46E5',
          'primary-dark': '#3730A3',
          charade: '#1E293B',
          'pale-sky': '#64748B',
          iron: '#E2E8F0',
          'athens-gray': '#F1F5F9',
          manatee: '#94A3B8',
          teal: '#475569',
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
