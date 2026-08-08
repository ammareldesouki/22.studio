'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/auth-provider';
import { PendingReviews } from '../../components/pending-reviews';

interface Stats {
  projects: { published: number; draft: number; archived: number; total: number };
  clients: number;
  services: number;
  media: number;
  messages: { unhandled: number; total: number };
}

function StatCard({ label, value, sub, href }: { label: string; value: number | string; sub?: string; href?: string }) {
  const inner = (
    <div className="panel h-full rounded-xl p-5 transition-colors hover:border-white/25">
      <div className="eyebrow">{label}</div>
      <div className="mt-3 font-display text-3xl font-bold tabular-nums text-white">{value}</div>
      {sub && <div className="mt-1 text-[13px] text-muted">{sub}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function Dashboard() {
  const { user, api, can } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api<Stats>('/api/stats')
      .then((s) => alive && setStats(s))
      .catch(() => alive && setError('Could not load stats'));
    return () => {
      alive = false;
    };
  }, [api]);

  const firstName = (user?.name || '').split(' ')[0] || 'there';

  return (
    <div>
      <div className="mb-7">
        <div className="eyebrow">Dashboard</div>
        <h1 className="mt-1 text-2xl">Welcome back, {firstName}</h1>
        <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s live on the 22 Studio site.</p>
      </div>

      {error && (
        <p role="alert" className="mb-6 rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-red">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={stats ? stats.projects.total : '—'}
          sub={stats ? `${stats.projects.published} live · ${stats.projects.draft} draft` : undefined}
          href={can('projects:edit') ? '/projects' : undefined}
        />
        <StatCard label="Clients" value={stats ? stats.clients : '—'} href={can('clients:manage') ? '/clients' : undefined} />
        <StatCard label="Services" value={stats ? stats.services : '—'} href={can('services:manage') ? '/services' : undefined} />
        <StatCard label="Media" value={stats ? stats.media : '—'} href={can('media:upload') ? '/media' : undefined} />
      </div>

      <PendingReviews />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="panel rounded-xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base">Messages</h2>
            <Link href="/messages" className="text-[13px] text-muted hover:text-white">
              View all →
            </Link>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold tabular-nums text-white">{stats ? stats.messages.unhandled : '—'}</span>
            <span className="text-sm text-muted">unread</span>
          </div>
          <p className="mt-1 text-[13px] text-muted">{stats ? `${stats.messages.total} total enquiries` : ' '}</p>
        </div>

        <div className="panel rounded-xl p-5">
          <h2 className="text-base">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {can('projects:create') && (
              <Link href="/projects/new" className="btn btn-red btn-sm">
                New project
              </Link>
            )}
            {can('clients:manage') && (
              <Link href="/clients" className="btn btn-ghost btn-sm">
                Add client
              </Link>
            )}
            {can('homepage:manage') && (
              <Link href="/homepage" className="btn btn-ghost btn-sm">
                Edit homepage
              </Link>
            )}
            {can('settings:manage') && (
              <Link href="/settings" className="btn btn-ghost btn-sm">
                Settings
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
