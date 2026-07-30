'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, StatusPill, Modal, ConfirmDialog } from '../../../components/ui';
import { SeoFields, MediaField, type Seo } from '../../../components/form';

interface Service {
  id: string;
  name: string;
  description: string | null;
  iconMediaId: string | null;
  status: string;
  version: number;
  seo: Seo;
  locale: string;
}
interface SubService { id: string; name: string; description: string | null; order: number }

const STATUS_ACTIONS: Record<string, { label: string; action: string }[]> = {
  DRAFT: [{ label: 'Publish', action: 'publish' }],
  PUBLISHED: [
    { label: 'Unpublish', action: 'unpublish' },
    { label: 'Archive', action: 'archive' },
  ],
  ARCHIVED: [{ label: 'Restore', action: 'restore' }],
};

export default function ServicesPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Service[] | null>(null);
  const [lang, setLang] = useState<'all' | 'en' | 'ar'>('all');
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<{ items: Service[] }>('/api/services?limit=100')
      .then((r) => setItems(r.items))
      .catch(() => toast('Could not load services', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function runStatus(s: Service, action: string) {
    try {
      await api(`/api/services/${s.id}/status`, { method: 'POST', body: JSON.stringify({ action, version: s.version }) });
      toast('Status updated');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  }

  async function duplicate(s: Service) {
    try {
      const copy = await api<Service>(`/api/services/${s.id}/duplicate`, { method: 'POST' });
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
      await api(`/api/services/${toDelete.id}`, { method: 'DELETE' });
      toast('Service deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete (may have projects)', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const visible = items?.filter((s) => lang === 'all' || s.locale === lang) ?? null;

  return (
    <div>
      <PageHeader eyebrow="Content" title="Services">
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
          New service
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : (visible ?? []).length === 0 ? (
        <EmptyState
          title="No services yet"
          hint="Describe what 22 Studio offers — editing, AI visuals, creative direction."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={() => setEditing('new')}>
              New service
            </button>
          }
        />
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <table className="dt">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Lang</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(visible ?? []).map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-white">{s.name}</td>
                  <td className="max-w-[280px] truncate text-muted">{s.description || '—'}</td>
                  <td>
                    <span className="chip">{s.locale.toUpperCase()}</span>
                  </td>
                  <td>
                    <StatusPill status={s.status} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {(STATUS_ACTIONS[s.status] ?? []).map((a) => (
                        <button key={a.action} type="button" className="btn btn-ghost btn-sm" onClick={() => runStatus(s, a.action)}>
                          {a.label}
                        </button>
                      ))}
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(s)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => duplicate(s)}>
                        Duplicate
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(s)}>
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
        <ServiceEditor
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete service?"
          body={`“${toDelete.name}” will be removed. Services with linked projects can't be deleted.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function ServiceEditor({ service, onClose, onSaved }: { service: Service | null; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [iconMediaId, setIconMediaId] = useState<string | null>(service?.iconMediaId ?? null);
  const [seo, setSeo] = useState<Seo>(service?.seo ?? {});
  const [locale, setLocale] = useState<'en' | 'ar'>(service?.locale === 'ar' ? 'ar' : 'en');
  const [busy, setBusy] = useState(false);

  const [subs, setSubs] = useState<SubService[]>([]);
  const [subName, setSubName] = useState('');

  const loadSubs = useCallback(() => {
    if (!service) return;
    api<{ subServices: SubService[] }>(`/api/services/${service.id}`)
      .then((r) => setSubs(r.subServices ?? []))
      .catch(() => undefined);
  }, [api, service]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  async function addSub() {
    if (!service || !subName.trim()) return;
    try {
      await api(`/api/services/${service.id}/subservices`, { method: 'POST', body: JSON.stringify({ name: subName.trim() }) });
      setSubName('');
      loadSubs();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add', 'error');
    }
  }

  async function removeSub(id: string) {
    try {
      await api(`/api/services/subservices/${id}`, { method: 'DELETE' });
      loadSubs();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove', 'error');
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const seoClean = { title: seo.title || undefined, metaDescription: seo.metaDescription || undefined };
    const payload: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      iconMediaId,
      seo: seoClean,
      locale,
    };
    try {
      if (service) {
        await api(`/api/services/${service.id}`, { method: 'PATCH', body: JSON.stringify({ ...payload, version: service.version }) });
        toast('Service updated');
      } else {
        await api('/api/services', { method: 'POST', body: JSON.stringify(payload) });
        toast('Service created');
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={service ? 'Edit service' : 'New service'} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="s-locale">Language</label>
          <select id="s-locale" className="input" value={locale} onChange={(e) => setLocale(e.target.value === 'ar' ? 'ar' : 'en')}>
            <option value="en">English</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="s-name">Name</label>
          <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label htmlFor="s-desc">Description</label>
          <textarea id="s-desc" className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <MediaField label="Icon" value={iconMediaId} onChange={setIconMediaId} allow="image" />

        {service ? (
          <div className="field">
            <label>Sub-services</label>
            <div className="flex flex-col gap-2">
              {subs.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                  <span className="text-white">{s.name}</span>
                  <button type="button" className="text-muted hover:text-red" onClick={() => removeSub(s.id)}>
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Add a sub-service…"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSub();
                    }
                  }}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={addSub}>
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-muted">Save the service first to add sub-services.</p>
        )}

        <SeoFields seo={seo} onChange={setSeo} />
        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Saving…' : service ? 'Save changes' : 'Create service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
