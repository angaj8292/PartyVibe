/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vibe: {
          bg: '#0F0F1A',
          card: '#1A1A2E',
          card2: '#24243E',
          accent: '#FF3366',
          purple: '#7928CA',
          cyan: '#00F2FE',
          gold: '#FFD700',
          dark: '#0B0B14'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'float-up': 'floatUp 3s ease-out forwards',
        'bounce-soft': 'bounceSoft 1.5s infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 15px rgba(255, 51, 102, 0.4)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 30px rgba(255, 51, 102, 0.8)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.6)' },
          '20%': { opacity: '1', transform: 'translateY(0) scale(1.1)' },
          '80%': { opacity: '1', transform: 'translateY(-30px) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-60px) scale(0.8)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    },
  },
  plugins: [],
}
