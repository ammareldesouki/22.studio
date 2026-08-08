'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { useToast } from './toast';
import { ConfirmDialog } from './ui';

interface Review {
  id: string;
  quote: string;
  authorName: string;
  email: string | null;
  pending: boolean;
}

// Dashboard panel that surfaces reviews awaiting moderation and lets the admin Accept
// (make live) or Decline (delete) them without leaving the dashboard. Renders nothing when
// there are no pending reviews or the user lacks the reviews permission.
export function PendingReviews() {
  const { api, can } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Review[] | null>(null);
  const [toDecline, setToDecline] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);

  const allowed = can('settings:manage');

  const reload = useCallback(() => {
    if (!allowed) return;
    api<Review[]>('/api/reviews')
      .then((all) => setItems(all.filter((r) => r.pending)))
      .catch(() => setItems([]));
  }, [api, allowed]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!allowed || !items || items.length === 0) return null;

  async function accept(r: Review) {
    try {
      await api(`/api/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ pending: false, active: true }) });
      toast('Review accepted — now live');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not accept', 'error');
    }
  }

  async function confirmDecline() {
    if (!toDecline) return;
    setBusy(true);
    try {
      await api(`/api/reviews/${toDecline.id}`, { method: 'DELETE' });
      toast('Review declined');
      setToDecline(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not decline', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 panel rounded-xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base">
          Pending reviews
          <span className="chip">{items.length}</span>
        </h2>
        <a href="/reviews" className="text-[13px] text-muted hover:text-white">
          Manage all →
        </a>
      </div>
      <p className="mt-1 text-[13px] text-muted">Submitted from the site — accept to publish, or decline to remove.</p>

      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border-l-2 border-red bg-white/[0.02] p-3.5">
            <div className="min-w-0">
              <p className="text-white">&ldquo;{r.quote}&rdquo;</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="font-display font-semibold text-white">{r.authorName}</span>
                {r.email && <span className="chip">{r.email}</span>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="btn btn-red btn-sm" onClick={() => accept(r)}>
                Accept
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDecline(r)}>
                Decline
              </button>
            </div>
          </li>
        ))}
      </ul>

      {toDecline && (
        <ConfirmDialog
          title="Decline review?"
          body={`The review by "${toDecline.authorName}" will be permanently removed.`}
          busy={busy}
          onConfirm={confirmDecline}
          onCancel={() => setToDecline(null)}
        />
      )}
    </div>
  );
}
