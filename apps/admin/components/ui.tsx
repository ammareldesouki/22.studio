'use client';

import { useEffect } from 'react';

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="mt-1 text-2xl">{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

const PILL: Record<string, string> = {
  PUBLISHED: 'pill-published',
  DRAFT: 'pill-draft',
  ARCHIVED: 'pill-archived',
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill ${PILL[status] ?? 'pill-draft'}`}>{status.toLowerCase()}</span>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-white" />
      {label}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center rounded-xl px-6 py-16 text-center">
      <p className="font-display text-base font-semibold text-white">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-10 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`panel relative z-10 w-full rounded-xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-white" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Delete',
  danger = true,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-muted">{body}</p>
      <div className="mt-6 flex justify-end gap-2.5">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-red'}`}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
