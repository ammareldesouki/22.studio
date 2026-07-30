'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../components/auth-provider';
import { useToast } from '../../../../components/toast';
import { PageHeader } from '../../../../components/ui';

export default function NewProjectPage() {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [locale, setLocale] = useState<'en' | 'ar'>('en');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const project = await api<{ id: string }>('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), overview: overview.trim() || undefined, locale }),
      });
      toast('Project created — add the details');
      router.replace(`/projects/${project.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create', 'error');
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/projects" className="hover:text-white">
            ← Projects
          </Link>
        }
        title="New project"
      />
      <form onSubmit={onSubmit} className="panel max-w-xl rounded-xl p-6">
        <div className="flex flex-col gap-4">
          <div className="field">
            <label htmlFor="p-locale">Language</label>
            <select id="p-locale" className="input" value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'ar')}>
              <option value="en">English</option>
              <option value="ar">العربية (Arabic)</option>
            </select>
            <p className="text-[12px] text-muted">Each language is a separate project. Create the Arabic version as its own project.</p>
          </div>
          <div className="field">
            <label htmlFor="p-title">Title</label>
            <input id="p-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label htmlFor="p-overview">Overview</label>
            <textarea
              id="p-overview"
              className="input"
              rows={3}
              placeholder="A one-line summary shown on the work grid."
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2.5">
            <Link href="/projects" className="btn btn-ghost btn-sm">
              Cancel
            </Link>
            <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
              {busy ? 'Creating…' : 'Create & continue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
