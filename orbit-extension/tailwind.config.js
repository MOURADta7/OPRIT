/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
    "./public/**/*.html"
  ],
  theme: {
    extend: {
      colors: {
        orbit: {
          primary: '#00d4ff',
          primaryDark: '#00a8cc',
          bg: '#1a1f36',
          bgLight: '#252b47',
          text: '#ffffff',
          muted: '#8b92a8',
          success: '#51cf66',
          warning: '#ffd93d',
          danger: '#ff6b6b'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}