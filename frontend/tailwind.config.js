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
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'check-draw': {
          '0%': { 'stroke-dashoffset': '30' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'check-draw': 'check-draw 0.5s ease-out 0.3s forwards',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}
