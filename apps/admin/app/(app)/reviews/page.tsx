'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, ConfirmDialog, Modal } from '../../../components/ui';

interface Review {
  id: string;
  quote: string;
  authorName: string;
  order: number;
  active: boolean;
}

interface FormState {
  quote: string;
  authorName: string;
  order: string;
  active: boolean;
}

const EMPTY: FormState = { quote: '', authorName: '', order: '0', active: true };

export default function ReviewsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Review[] | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<Review[]>('/api/reviews')
      .then(setItems)
      .catch(() => toast('Could not load reviews', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, order: String(items?.length ?? 0) });
  }

  function openEdit(r: Review) {
    setEditing(r);
    setForm({ quote: r.quote, authorName: r.authorName, order: String(r.order), active: r.active });
  }

  function closeForm() {
    setForm(null);
    setEditing(null);
  }

  async function save() {
    if (!form) return;
    if (!form.quote.trim()) {
      toast('Review text is required', 'error');
      return;
    }
    if (!form.authorName.trim()) {
      toast('Client name is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      quote: form.quote.trim(),
      authorName: form.authorName.trim(),
      order: Number.isFinite(parseInt(form.order, 10)) ? parseInt(form.order, 10) : 0,
      active: form.active,
    };
    try {
      if (editing) {
        await api(`/api/reviews/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast('Review updated');
      } else {
        await api('/api/reviews', { method: 'POST', body: JSON.stringify(payload) });
        toast('Review added');
      }
      closeForm();
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: Review) {
    try {
      await api(`/api/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ active: !r.active }) });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/reviews/${toDelete.id}`, { method: 'DELETE' });
      toast('Review deleted');
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
      <PageHeader eyebrow="Content" title="Reviews">
        <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
          Add review
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          hint="Add client reviews here and they appear in the reviews section on the site."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
              Add review
            </button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((r) => (
            <li key={r.id} className={`panel flex flex-wrap items-start justify-between gap-3 rounded-xl p-4 ${r.active ? '' : 'opacity-60'}`}>
              <div className="min-w-0">
                <p className="text-white">&ldquo;{r.quote}&rdquo;</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold text-white">{r.authorName}</span>
                  {!r.active && <span className="chip">hidden</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(r)}>
                  {r.active ? 'Hide' : 'Show'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(r)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal title={editing ? 'Edit review' : 'Add review'} onClose={closeForm}>
          <div className="grid gap-4">
            <div className="field">
              <label htmlFor="r-quote">Review text</label>
              <textarea id="r-quote" className="input" rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="Impressed by the professionalism and attention to detail." />
              <p className="mt-1 text-[12px] text-muted">Shown as-is on both the English and Arabic site.</p>
            </div>
            <div className="field">
              <label htmlFor="r-name">Client name</label>
              <input id="r-name" className="input" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Guy Hawkins" />
            </div>
            <div className="flex items-end gap-4">
              <div className="field w-24">
                <label htmlFor="r-order">Order</label>
                <input id="r-order" type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-white">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Shown on site
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-red btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add review'}
            </button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete review?"
          body={`The review by "${toDelete.authorName}" will be permanently removed.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
