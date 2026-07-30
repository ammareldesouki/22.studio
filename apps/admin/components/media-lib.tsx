'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './auth-provider';
import { Modal, Spinner, EmptyState } from './ui';

export interface MediaItem {
  id: string;
  type: string;
  url: string;
  posterUrl: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
}

type ApiFn = <T>(path: string, init?: RequestInit) => Promise<T>;

// Presigned three-step upload: intent → PUT bytes to R2 → confirm.
export async function uploadFile(file: File, api: ApiFn): Promise<MediaItem> {
  const intent = await api<{ mediaId: string; uploadUrl: string }>('/api/media/upload-intent', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
  });
  const put = await fetch(intent.uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } });
  if (!put.ok) throw new Error('Upload to storage failed — check R2 bucket CORS.');
  return api<MediaItem>(`/api/media/${intent.mediaId}/confirm`, { method: 'POST' });
}

// Add media by external link (image / direct video / YouTube / Vimeo).
export async function addMediaLink(url: string, api: ApiFn): Promise<MediaItem> {
  return api<MediaItem>('/api/media/link', { method: 'POST', body: JSON.stringify({ url: url.trim() }) });
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}

export function useMediaList() {
  const { api } = useAuth();
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    api<{ items: MediaItem[] }>('/api/media?limit=100')
      .then((r) => setItems(r.items))
      .catch(() => setError('Could not load media'));
  }, [api]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, error, reload, setItems };
}

export function MediaThumb({ item, className = '' }: { item: MediaItem; className?: string }) {
  if (item.type === 'IMAGE') {
    return <img src={item.posterUrl || item.url} alt={item.alt ?? ''} className={`object-cover ${className}`} loading="lazy" />;
  }
  // Video-like (VIDEO / YOUTUBE / VIMEO). Prefer a stored poster; fall back to a derived
  // YouTube thumbnail, then to previewing the video file itself, then a plain badge.
  const yid = item.type === 'YOUTUBE' ? youtubeId(item.url) : null;
  const poster = item.posterUrl || (yid ? `https://img.youtube.com/vi/${yid}/hqdefault.jpg` : null);
  const isFileVideo = item.type === 'VIDEO' || item.type === 'BEFORE_AFTER';
  return (
    <div className={`relative grid place-items-center bg-black/50 ${className}`}>
      {poster ? (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      ) : isFileVideo ? (
        <video src={item.url} muted playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      ) : null}
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-red text-sm text-white">▶</span>
      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
        {item.type}
      </span>
    </div>
  );
}

// Small modal to add media from a pasted URL.
export function AddLinkModal({ onClose, onAdded }: { onClose: () => void; onAdded: (m: MediaItem) => void }) {
  const { api } = useAuth();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const media = await addMediaLink(url, api);
      onAdded(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add link');
      setBusy(false);
    }
  }

  return (
    <Modal title="Add media by link" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="media-url">Image or video URL</label>
          <input
            id="media-url"
            className="input"
            placeholder="https://… (image, .mp4, YouTube, or Vimeo)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            autoFocus
          />
          <p className="text-[12px] text-muted">We detect the type automatically — paste an image link, a video file, or a YouTube/Vimeo link.</p>
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        <div className="mt-1 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Adding…' : 'Add media'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Modal media picker used by clients/services/projects/settings.
export function MediaPicker({
  onPick,
  onClose,
  allow = 'all',
}: {
  onPick: (item: MediaItem) => void;
  onClose: () => void;
  allow?: 'all' | 'image';
}) {
  const { api } = useAuth();
  const { items, error, reload } = useMediaList();
  const [busy, setBusy] = useState(false);
  const [linking, setLinking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = (items ?? []).filter((m) => allow === 'all' || m.type === 'IMAGE');

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const media = await uploadFile(file, api);
      reload();
      onPick(media);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Modal title="Select media" onClose={onClose} wide>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Choose an item, upload a file, or add a link.</p>
        <div className="flex gap-2">
          {allow === 'all' && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setLinking(true)}>
              Add link
            </button>
          )}
          <button type="button" className="btn btn-red btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        <input ref={fileRef} type="file" accept={allow === 'image' ? 'image/*' : 'image/*,video/*'} className="hidden" onChange={onUpload} />
      </div>

      {error && <p className="text-sm text-red">{error}</p>}
      {items === null ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No media yet" hint="Upload a file or add a link to get started." />
      ) : (
        <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
          {filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onPick(m)}
              className="group aspect-square overflow-hidden rounded-lg border border-line transition-colors hover:border-red"
            >
              <MediaThumb item={m} className="h-full w-full transition-transform group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}

      {linking && (
        <AddLinkModal
          onClose={() => setLinking(false)}
          onAdded={(m) => {
            setLinking(false);
            reload();
            onPick(m);
          }}
        />
      )}
    </Modal>
  );
}
