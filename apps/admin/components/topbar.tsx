'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await logout();
    router.replace('/login');
  }

  const initials =
    (user?.name || user?.email || '?')
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-ink px-5">
      <a
        href={process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3100'}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-muted transition-colors hover:text-white"
      >
        View site ↗
      </a>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-md px-1.5 py-1 text-sm hover:bg-white/[0.04]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-card-2 font-display text-xs font-bold text-white">{initials}</span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-[13px] font-semibold text-white">{user?.name || 'User'}</span>
            <span className="block text-[11px] text-muted">{user?.role?.name}</span>
          </span>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-line bg-card p-1.5 shadow-xl">
              <div className="px-3 py-2 text-[13px]">
                <div className="truncate font-semibold text-white">{user?.name}</div>
                <div className="truncate text-[12px] text-muted">{user?.email}</div>
              </div>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={onLogout}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-white/[0.04] hover:text-white"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
