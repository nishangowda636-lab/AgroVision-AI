/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agro: {
          dark: '#06131D',
          card: 'rgba(11, 43, 29, 0.65)',
          forest: '#0B2B1D',
          emerald: '#10B981',
          teal: '#14B8A6',
          glow: '#059669',
          accent: '#F59E0B',
          light: '#ECFDF5',
          border: 'rgba(16, 185, 129, 0.25)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-teal': '0 0 25px rgba(20, 184, 166, 0.35)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
