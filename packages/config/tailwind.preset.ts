import type { Config } from 'tailwindcss';

// 22 STUDIO brand system (docs/22studio_brand_guidelines + docs/design/public-site-design-system.md).
// Dark-first, disciplined red accent. Fonts are wired via CSS variables set by next/font.
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        'ink-deep': '#0d0d0f',
        card: '#1a1a1a',
        'card-2': '#202025',
        red: {
          DEFAULT: '#e8192c',
          dim: '#b3111f',
        },
        line: 'rgba(255,255,255,0.10)',
        muted: '#8b8a83',
        light: '#f5f5f5',
        bordergray: '#cccccc',
        // keep a `primary` alias so any stray references resolve to the brand red
        primary: {
          DEFAULT: '#e8192c',
          500: '#e8192c',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Montserrat', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Open Sans', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Tajawal', 'sans-serif'],
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16,1,0.3,1)',
        cut: 'cubic-bezier(0.7,0,0.3,1)',
      },
      maxWidth: {
        site: '1440px',
      },
    },
  },
  plugins: [],
};

export default preset;
