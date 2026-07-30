'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => undefined });

// Runs before paint (injected in <head>) so the correct theme is applied with no flash.
// Kept in sync with the provider's resolution logic: explicit choice wins, else OS setting.
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var m=window.matchMedia('(prefers-color-scheme: light)').matches;var t=(s==='light'||s==='dark')?s:(m?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Adopt whatever the no-flash script already set, then follow the OS if the user
  // has not made an explicit choice.
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const current = (document.documentElement.getAttribute('data-theme') as Theme) || 'dark';
    setTheme(current);
    if (stored === 'light' || stored === 'dark') return;

    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setTheme(mq.matches ? 'light' : 'dark');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* ignore storage failures (private mode) */
      }
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

// Sun / moon toggle. Icons swap by theme; label stays accessible.
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`grid h-9 w-9 place-items-center rounded-full border border-line text-fg-strong transition-colors hover:border-red hover:text-red ${className}`}
      data-cursor
    >
      {isDark ? (
        // moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" fill="currentColor" />
        </svg>
      ) : (
        // sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  );
}
