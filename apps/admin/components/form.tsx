'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './auth-provider';
import { MediaPicker, MediaThumb, type MediaItem } from './media-lib';

export interface Seo {
  title?: string;
  metaDescription?: string;
}

export function SeoFields({ seo, onChange }: { seo: Seo; onChange: (seo: Seo) => void }) {
  return (
    <details className="rounded-lg border border-line">
      <summary className="cursor-pointer select-none px-4 py-3 font-display text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">
        SEO (optional)
      </summary>
      <div className="flex flex-col gap-4 border-t border-line p-4">
        <div className="field">
          <label htmlFor="seo-title">Meta title</label>
          <input
            id="seo-title"
            className="input"
            maxLength={160}
            value={seo.title ?? ''}
            onChange={(e) => onChange({ ...seo, title: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="seo-desc">Meta description</label>
          <textarea
            id="seo-desc"
            className="input"
            rows={2}
            maxLength={320}
            value={seo.metaDescription ?? ''}
            onChange={(e) => onChange({ ...seo, metaDescription: e.target.value })}
          />
        </div>
      </div>
    </details>
  );
}

// Media selector bound to a media id. Resolves the thumbnail for an existing id on mount.
export function MediaField({
  label,
  value,
  onChange,
  allow = 'all',
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  allow?: 'all' | 'image';
}) {
  const { api } = useAuth();
  const [item, setItem] = useState<MediaItem | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (!value) {
      setItem(null);
      return;
    }
    if (item?.id === value) return;
    let alive = true;
    api<MediaItem>(`/api/media/${value}`)
      .then((m) => alive && setItem(m))
      .catch(() => alive && setItem(null));
    return () => {
      alive = false;
    };
  }, [value, api, item?.id]);

  return (
    <div className="field">
      <label>{label}</label>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-black/30 text-xs text-muted">
          {item ? <MediaThumb item={item} className="h-full w-full" /> : '—'}
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
            {value ? 'Change' : 'Select'}
          </button>
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(null)}>
              Remove
            </button>
          )}
        </div>
      </div>
      {picking && (
        <MediaPicker
          allow={allow}
          onClose={() => setPicking(false)}
          onPick={(m) => {
            setItem(m);
            onChange(m.id);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
