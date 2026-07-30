import type { Config } from 'tailwindcss';

// 22 STUDIO brand system (docs/22studio_brand_guidelines + docs/design/public-site-design-system.md).
// Disciplined red accent, theme-aware. The neutral palette is driven by CSS variables (see
// apps/web globals.css) so the same tokens resolve to dark or light per [data-theme]. The red
// accent is brand-fixed and identical in both themes.
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--bg) / <alpha-value>)',
        'ink-deep': 'rgb(var(--bg-deep) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        'card-2': 'rgb(var(--card-2) / <alpha-value>)',
        // Primary + strong foreground text (replaces literal text-white for themeable text).
        fg: 'rgb(var(--fg) / <alpha-value>)',
        'fg-strong': 'rgb(var(--fg-strong) / <alpha-value>)',
        red: {
          DEFAULT: '#e8192c',
          dim: '#b3111f',
        },
        line: 'rgb(var(--line-rgb) / 0.10)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
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
