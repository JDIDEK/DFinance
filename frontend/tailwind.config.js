/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': {
          'orange': '#FF6B00',
          'dark-orange': '#E55A00',
          'black': '#000000',
          'dark-gray': '#1a1a1a',
          'gray': '#2d2d2d',
          'light-gray': '#404040',
        },
        'accent': {
          'green': '#00FF88',
          'red': '#FF3366',
          'blue': '#00AAFF',
        }
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
      },
      animation: {
        'pulse-orange': 'pulse-orange 2s infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'racing-stripe': 'racing-stripe 3s linear infinite',
        'shine': 'shine 2s infinite',
      },
      keyframes: {
        'pulse-orange': {
          '0%, 100%': { boxShadow: '0 0 5px #FF6B00' },
          '50%': { boxShadow: '0 0 20px #FF6B00, 0 0 30px #FF6B00' },
        },
        'slide-in': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in-up': {
          'from': { transform: 'translateY(30px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
        'racing-stripe': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        'shine': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      }
    },
  },
  plugins: [],
}
