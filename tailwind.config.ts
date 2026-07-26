import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // KETAMI Brand Identity Book v1.0 — section 06.
      fontFamily: {
        display: ['var(--font-display-face)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans-face)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        arabic: ['var(--font-arabic)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Rule-breakers — accents only, max one per composition (section 07)
        ruqaa: ['var(--font-ruqaa)', 'serif'],
        marker: ['var(--font-marker)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
