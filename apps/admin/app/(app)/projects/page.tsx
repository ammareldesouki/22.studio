'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, StatusPill, ConfirmDialog } from '../../../components/ui';

interface Project { id: string; title: string; slug: string; status: string; version: number; clientId: string | null; locale: string; featured: boolean; order: number }

export default function ProjectsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [items, setItems] = useState<Project[] | null>(null);
  const [lang, setLang] = useState<'all' | 'en' | 'ar'>('all');
  const [toDelete, setToDelete] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<{ items: Project[] }>('/api/projects?limit=100')
      .then((r) => setItems(r.items))
      .catch(() => toast('Could not load projects', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function toggleFeatured(p: Project) {
    try {
      await api(`/api/projects/${p.id}`, { method: 'PATCH', body: JSON.stringify({ featured: !p.featured, version: p.version }) });
      toast(p.featured ? 'Removed from Selected work' : 'Added to Selected work');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function move(p: Project, dir: -1 | 1) {
    if (!visible) return;
    const idx = visible.findIndex((x) => x.id === p.id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= visible.length) return;
    const reordered = [...visible];
    const a = reordered[idx];
    const b = reordered[j];
    if (!a || !b) return;
    reordered[idx] = b;
    reordered[j] = a;
    try {
      await api('/api/projects/reorder', { method: 'POST', body: JSON.stringify({ orderedIds: reordered.map((x) => x.id) }) });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reorder failed', 'error');
    }
  }

  async function duplicate(p: Project) {
    try {
      const copy = await api<{ id: string }>(`/api/projects/${p.id}/duplicate`, { method: 'POST' });
      toast('Duplicated — edit the copy (e.g. switch to Arabic)');
      router.push(`/projects/${copy.id}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not duplicate', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/projects/${toDelete.id}`, { method: 'DELETE' });
      toast('Project deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const visible = items?.filter((p) => lang === 'all' || p.locale === lang) ?? null;

  return (
    <div>
      <PageHeader eyebrow="Content" title="Projects">
        <div className="flex rounded-md border border-line p-0.5 text-sm">
          {(['all', 'en', 'ar'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded px-3 py-1.5 uppercase ${lang === l ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
            >
              {l === 'all' ? 'All' : l}
            </button>
          ))}
        </div>
        <Link href="/projects/new" className="btn btn-red">
          New project
        </Link>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : (visible ?? []).length === 0 ? (
        <EmptyState
          title="No projects yet"
          hint="Case studies are the heart of the portfolio. Create your first one."
          action={
            <Link href="/projects/new" className="btn btn-red btn-sm">
              New project
            </Link>
          }
        />
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <table className="dt">
            <thead>
              <tr>
                <th className="w-px">Order</th>
                <th>Title</th>
                <th>Slug</th>
                <th>Lang</th>
                <th>Selected work</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(visible ?? []).map((p, i) => (
                <tr key={p.id}>
                  <td>
                    <div className="flex flex-col">
                      <button type="button" className="text-muted hover:text-white disabled:opacity-30" onClick={() => move(p, -1)} disabled={i === 0} aria-label="Move up">
                        ↑
                      </button>
                      <button type="button" className="text-muted hover:text-white disabled:opacity-30" onClick={() => move(p, 1)} disabled={i === (visible?.length ?? 0) - 1} aria-label="Move down">
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="font-medium text-white">{p.title}</td>
                  <td className="text-muted">/{p.slug}</td>
                  <td>
                    <span className="chip">{p.locale.toUpperCase()}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => toggleFeatured(p)}
                      className={`chip ${p.featured ? 'text-red' : 'text-muted'}`}
                      title="Toggle whether this project shows in the homepage Selected work"
                    >
                      {p.featured ? '★ Featured' : '☆ Add'}
                    </button>
                  </td>
                  <td>
                    <StatusPill status={p.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link href={`/projects/${p.id}`} className="btn btn-ghost btn-sm">
                        Edit
                      </Link>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => duplicate(p)}>
                        Duplicate
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(p)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete project?"
          body={`“${toDelete.title}” and its case-study content will be permanently removed.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
