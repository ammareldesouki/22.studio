'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, StatusPill, Modal, ConfirmDialog } from '../../../components/ui';
import { SeoFields, MediaField, type Seo } from '../../../components/form';

interface Client {
  id: string;
  name: string;
  website: string | null;
  logoId: string | null;
  status: string;
  slug: string;
  version: number;
  seo: Seo;
  locale: string;
  displayMode: string;
}

const STATUS_ACTIONS: Record<string, { label: string; action: string }[]> = {
  DRAFT: [{ label: 'Publish', action: 'publish' }],
  PUBLISHED: [
    { label: 'Unpublish', action: 'unpublish' },
    { label: 'Archive', action: 'archive' },
  ],
  ARCHIVED: [{ label: 'Restore', action: 'restore' }],
};

export default function ClientsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Client[] | null>(null);
  const [lang, setLang] = useState<'all' | 'en' | 'ar'>('all');
  const [editing, setEditing] = useState<Client | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<{ items: Client[] }>('/api/clients?limit=100')
      .then((r) => setItems(r.items))
      .catch(() => toast('Could not load clients', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function runStatus(c: Client, action: string) {
    try {
      await api(`/api/clients/${c.id}/status`, { method: 'POST', body: JSON.stringify({ action, version: c.version }) });
      toast('Status updated');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  }

  async function duplicate(c: Client) {
    try {
      const copy = await api<Client>(`/api/clients/${c.id}/duplicate`, { method: 'POST' });
      toast('Duplicated — edit the copy (e.g. switch to Arabic)');
      reload();
      setEditing(copy);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not duplicate', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/clients/${toDelete.id}`, { method: 'DELETE' });
      toast('Client deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete (may have projects)', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const visible = items?.filter((c) => lang === 'all' || c.locale === lang) ?? null;

  return (
    <div>
      <PageHeader eyebrow="Content" title="Clients">
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
        <button type="button" className="btn btn-red" onClick={() => setEditing('new')}>
          New client
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : (visible ?? []).length === 0 ? (
        <EmptyState
          title="No clients yet"
          hint="Add the brands 22 Studio has worked with — they power the clients wall."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={() => setEditing('new')}>
              New client
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <table className="dt">
            <thead>
              <tr>
                <th>Name</th>
                <th>Website</th>
                <th>Lang</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(visible ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-white">{c.name}</td>
                  <td className="text-muted">{c.website ? new URL(c.website).host : '—'}</td>
                  <td>
                    <span className="chip">{c.locale.toUpperCase()}</span>
                  </td>
                  <td>
                    <StatusPill status={c.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {(STATUS_ACTIONS[c.status] ?? []).map((a) => (
                        <button key={a.action} type="button" className="btn btn-ghost btn-sm" onClick={() => runStatus(c, a.action)}>
                          {a.label}
                        </button>
                      ))}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => duplicate(c)}>
                        Duplicate
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(c)}>
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

      {editing && (
        <ClientEditor
          client={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete client?"
          body={`“${toDelete.name}” will be removed. Clients with linked projects can't be deleted.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function ClientEditor({ client, onClose, onSaved }: { client: Client | null; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(client?.name ?? '');
  const [website, setWebsite] = useState(client?.website ?? '');
  const [logoId, setLogoId] = useState<string | null>(client?.logoId ?? null);
  const [seo, setSeo] = useState<Seo>(client?.seo ?? {});
  const [locale, setLocale] = useState<'en' | 'ar'>(client?.locale === 'ar' ? 'ar' : 'en');
  const [displayMode, setDisplayMode] = useState<'both' | 'name' | 'logo'>(
    client?.displayMode === 'name' || client?.displayMode === 'logo' ? client.displayMode : 'both',
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const seoClean = { title: seo.title || undefined, metaDescription: seo.metaDescription || undefined };
    const payload: Record<string, unknown> = {
      name: name.trim(),
      website: website.trim() || null,
      logoId,
      seo: seoClean,
      locale,
      displayMode,
    };
    try {
      if (client) {
        await api(`/api/clients/${client.id}`, { method: 'PATCH', body: JSON.stringify({ ...payload, version: client.version }) });
        toast('Client updated');
      } else {
        await api('/api/clients', { method: 'POST', body: JSON.stringify(payload) });
        toast('Client created');
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={client ? 'Edit client' : 'New client'} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="c-locale">Language</label>
          <select id="c-locale" className="input" value={locale} onChange={(e) => setLocale(e.target.value === 'ar' ? 'ar' : 'en')}>
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="c-name">Name</label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="c-web">Website</label>
          <input id="c-web" className="input" type="url" placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <MediaField label="Logo" value={logoId} onChange={setLogoId} allow="image" />
        <div className="field">
          <label htmlFor="c-display">Show on site as</label>
          <select id="c-display" className="input" value={displayMode} onChange={(e) => setDisplayMode(e.target.value as 'both' | 'name' | 'logo')}>
            <option value="both">Logo + name</option>
            <option value="name">Name only</option>
            <option value="logo">Logo only</option>
          </select>
          <p className="text-[12px] text-muted">How this client appears in the clients wall and list.</p>
        </div>
        <SeoFields seo={seo} onChange={setSeo} />
        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Saving…' : client ? 'Save changes' : 'Create client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
