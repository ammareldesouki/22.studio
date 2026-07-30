'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, ConfirmDialog } from '../../../components/ui';

interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  budget: string | null;
  locale: string;
  handled: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Message[] | null>(null);
  const [filter, setFilter] = useState<'all' | 'unhandled'>('unhandled');
  const [toDelete, setToDelete] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    const q = filter === 'unhandled' ? '?handled=false' : '';
    api<Message[]>(`/api/messages${q}`)
      .then(setItems)
      .catch(() => toast('Could not load messages', 'error'));
  }, [api, filter, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function toggle(m: Message) {
    try {
      await api(`/api/messages/${m.id}`, { method: 'PATCH', body: JSON.stringify({ handled: !m.handled }) });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/messages/${toDelete.id}`, { method: 'DELETE' });
      toast('Message deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Inbox" title="Messages">
        <div className="flex rounded-md border border-line p-0.5 text-sm">
          {(['unhandled', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-3 py-1.5 capitalize ${filter === f ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
            >
              {f === 'unhandled' ? 'Unread' : 'All'}
            </button>
          ))}
        </div>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title={filter === 'unhandled' ? 'No unread messages' : 'No messages yet'} hint="Contact-form enquiries from the public site land here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((m) => (
            <li key={m.id} className={`panel rounded-xl p-5 ${m.handled ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-white">{m.name}</span>
                    <a href={`mailto:${m.email}`} className="text-sm text-muted hover:text-white">
                      {m.email}
                    </a>
                    <span className="chip">{m.locale.toUpperCase()}</span>
                    {m.budget && <span className="chip">💰 {m.budget}</span>}
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted">{new Date(m.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggle(m)}>
                    {m.handled ? 'Mark unread' : 'Mark handled'}
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(m)}>
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[#d6d6d8]">{m.message}</p>
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete message?"
          body={`The enquiry from ${toDelete.name} will be permanently removed.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
