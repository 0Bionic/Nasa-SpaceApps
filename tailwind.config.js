/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#050b14',
          900: '#0a1628',
          800: '#12233d',
          700: '#1a3355',
          600: '#25456e',
        },
        teal: {
          glow: '#2dd4bf',
          soft: '#5eead4',
        },
        status: {
          green: '#22c55e',
          yellow: '#eab308',
          amber: '#f59e0b',
          red: '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Orbitron"', 'system-ui', 'sans-serif'],
        body: ['"Exo 2"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(45, 212, 191, 0.25)',
      },
      keyframes: {
        pulseCritical: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.04)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-critical': 'pulseCritical 1.4s ease-in-out infinite',
        'fade-up': 'fadeUp 0.45s ease-out both',
      },
    },
  },
  plugins: [],
};
