/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A1322',
        hull: '#101C2F',
        deck: '#16253B',
        rule: '#22344F',
        'rule-strong': '#33496A',
        star: '#E6ECF5',
        dust: '#8D9DB5',
        faint: '#5C6E8A',
        limb: '#7FB2FF',
        'limb-deep': '#3F7BE0',
        sev: {
          green: '#3CCB8A',
          yellow: '#EFCB45',
          amber: '#FF9A3D',
          red: '#FF5C61',
        },
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        sonar: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(3.2)', opacity: '0' },
        },
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0.25' } },
        rise: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        sonar: 'sonar 2.4s cubic-bezier(0.2, 0.6, 0.3, 1) infinite',
        blink: 'blink 1.2s steps(1) infinite',
        rise: 'rise 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) both',
      },
    },
  },
  plugins: [],
};
