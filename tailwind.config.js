/** @type {import('tailwindcss').Config} */
/** Color backed by an "R G B" CSS variable, so Tailwind opacity modifiers still work. */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

/**
 * NASA theme: pitch-black fields, NASA blue #105BD8 (+ glowing #3D8BFF accent),
 * NASA red #FC3D21, white type.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Every color reads a CSS variable so light/dark mode can swap it
        // (values live in src/styles/index.css).
        void: v('--c-bg'),
        hull: v('--c-bg'),
        deck: v('--c-deck'),
        rule: v('--c-line'),
        'rule-strong': v('--c-line-strong'),
        star: v('--c-text'),
        dust: v('--c-muted'),
        faint: v('--c-faint'),
        limb: v('--c-accent'),
        'limb-deep': v('--c-blue'),
        'nasa-blue': v('--c-nasa-blue'),
        'nasa-primary': v('--c-blue'),
        'nasa-red': v('--c-red'),
        alert: v('--c-alert'),
        'alert-sub': v('--c-alert-sub'),
        n: {
          ink: v('--c-bg'),
          panel: v('--c-bg'),
          raised: v('--c-bg'),
          line: v('--c-line'),
          neon: v('--c-accent'),
          blue: v('--c-blue'),
          text: v('--c-text'),
          muted: v('--c-muted'),
          faint: v('--c-faint'), // text-safe (≥4.5:1); --c-dim is for decoration only
          green: v('--sev-green'),
          amber: v('--sev-amber'),
          red: v('--c-red'),
        },
        sev: {
          green: v('--sev-green'),
          yellow: v('--sev-yellow'),
          amber: v('--sev-amber'),
          red: v('--sev-red'),
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Public Sans', 'system-ui', 'sans-serif'],
        ui: ['Public Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      // Crew-readable type scale, in rem so "Large text" mode scales everything.
      // NASA-STD-3001 Vol. 2 Appendix F: character height at least 0.25 deg (0.4 deg preferred).
      // With the CSS reference pixel, 16px text is about the 0.25 deg minimum, so 16px is the
      // smallest size for anything the crew must read; 2xs (14px) is for uppercase tags and
      // chart ticks only.
      fontSize: {
        '2xs': ['0.875rem', { lineHeight: '1.25rem' }],
        xs: ['1rem', { lineHeight: '1.45rem' }],
        sm: ['1.0625rem', { lineHeight: '1.6rem' }],
        base: ['1.125rem', { lineHeight: '1.7rem' }],
        lg: ['1.25rem', { lineHeight: '1.8rem' }],
        xl: ['1.4375rem', { lineHeight: '2rem' }],
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }],
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
