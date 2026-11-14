/** @type {import('tailwindcss').Config} */
/**
 * Palette inspired by NASA insignia + NASA Web Design System:
 * blue #0B3D91 / #105BD8, red #FC3D21, deep navy fields, white type.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#060F24',
        hull: '#0B1E42',
        deck: '#0E2C5C',
        rule: '#1A3F78',
        'rule-strong': '#2A5AA0',
        star: '#FFFFFF',
        dust: '#A7B6CE',
        faint: '#6F84A6',
        limb: '#5BA8FF',
        'limb-deep': '#105BD8',
        'nasa-blue': '#0B3D91',
        'nasa-primary': '#105BD8',
        'nasa-red': '#FC3D21',
        sev: {
          green: '#4AA564',
          yellow: '#FF9D1E',
          amber: '#F9AA43',
          red: '#FC3D21',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        blink: { '0%, 49%': { opacity: '1' }, '50%, 100%': { opacity: '0.25' } },
      },
      animation: {
        blink: 'blink 1.2s steps(1) infinite',
      },
    },
  },
  plugins: [],
};
