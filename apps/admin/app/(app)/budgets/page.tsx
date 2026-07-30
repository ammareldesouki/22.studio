'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, ConfirmDialog, Modal } from '../../../components/ui';

interface Budget {
  id: string;
  labelEn: string;
  labelAr: string | null;
  amount: string | null;
  order: number;
  active: boolean;
}

interface FormState {
  labelEn: string;
  labelAr: string;
  amount: string;
  order: string;
  active: boolean;
}

const EMPTY: FormState = { labelEn: '', labelAr: '', amount: '', order: '0', active: true };

export default function BudgetsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Budget[] | null>(null);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<Budget[]>('/api/budgets')
      .then(setItems)
      .catch(() => toast('Could not load budgets', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, order: String(items?.length ?? 0) });
  }

  function openEdit(b: Budget) {
    setEditing(b);
    setForm({ labelEn: b.labelEn, labelAr: b.labelAr ?? '', amount: b.amount ?? '', order: String(b.order), active: b.active });
  }

  function closeForm() {
    setForm(null);
    setEditing(null);
  }

  async function save() {
    if (!form) return;
    if (!form.labelEn.trim()) {
      toast('English label is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      labelEn: form.labelEn.trim(),
      labelAr: form.labelAr.trim() || null,
      amount: form.amount.trim() || null,
      order: Number.isFinite(parseInt(form.order, 10)) ? parseInt(form.order, 10) : 0,
      active: form.active,
    };
    try {
      if (editing) {
        await api(`/api/budgets/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast('Budget updated');
      } else {
        await api('/api/budgets', { method: 'POST', body: JSON.stringify(payload) });
        toast('Budget added');
      }
      closeForm();
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(b: Budget) {
    try {
      await api(`/api/budgets/${b.id}`, { method: 'PATCH', body: JSON.stringify({ active: !b.active }) });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/budgets/${toDelete.id}`, { method: 'DELETE' });
      toast('Budget deleted');
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
      <PageHeader eyebrow="Contact form" title="Budgets">
        <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
          Add budget
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No budgets yet"
          hint="Add budget options here and they appear as a dropdown in the public contact form."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
              Add budget
            </button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((b) => (
            <li key={b.id} className={`panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 ${b.active ? '' : 'opacity-60'}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold text-white">{b.labelEn}</span>
                  {b.amount && <span className="chip">{b.amount}</span>}
                  {!b.active && <span className="chip">hidden</span>}
                </div>
                {b.labelAr && <p className="mt-0.5 text-sm text-muted" dir="rtl">{b.labelAr}</p>}
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(b)}>
                  {b.active ? 'Hide' : 'Show'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(b)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal title={editing ? 'Edit budget' : 'Add budget'} onClose={closeForm}>
          <div className="grid gap-4">
            <div className="field">
              <label htmlFor="b-en">Label (English)</label>
              <input id="b-en" className="input" value={form.labelEn} onChange={(e) => setForm({ ...form, labelEn: e.target.value })} placeholder="Starter" />
            </div>
            <div className="field">
              <label htmlFor="b-ar">Label (Arabic)</label>
              <input id="b-ar" className="input" dir="rtl" value={form.labelAr} onChange={(e) => setForm({ ...form, labelAr: e.target.value })} placeholder="مبدئي" />
            </div>
            <div className="field">
              <label htmlFor="b-amount">Amount / range</label>
              <input id="b-amount" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="$1k–$5k" />
              <p className="mt-1 text-[12px] text-muted">Free text — type the currency yourself (e.g. $1k–$5k, 20,000 EGP).</p>
            </div>
            <div className="flex items-end gap-4">
              <div className="field w-24">
                <label htmlFor="b-order">Order</label>
                <input id="b-order" type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-white">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Shown in form
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-red btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add budget'}
            </button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete budget?"
          body={`"${toDelete.labelEn}" will be removed from the contact form.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
