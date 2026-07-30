'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from './nav';
import { useAuth } from './auth-provider';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { can } = useAuth();

  return (
    <aside className="hidden w-[236px] shrink-0 flex-col border-r border-line bg-ink-deep md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-red font-display text-base font-extrabold text-white">22</span>
        <div className="leading-tight">
          <div className="font-display text-[13px] font-bold tracking-tight">STUDIO</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Content Manager</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => {
          const items = group.items.filter((it) => !it.perms || it.perms.some((p) => can(p)));
          if (items.length === 0) return null;
          return (
            <div key={group.title} className="mb-5">
              <div className="px-2 pb-2 pt-3 eyebrow">{group.title}</div>
              <ul className="flex flex-col gap-0.5">
                {items.map((it) => {
                  const active = isActive(pathname, it.href);
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                          active ? 'bg-white/[0.06] font-semibold text-white' : 'text-muted hover:bg-white/[0.03] hover:text-white'
                        }`}
                      >
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
