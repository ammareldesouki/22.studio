'use client';

import { useRef, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, ConfirmDialog } from '../../../components/ui';
import { MediaThumb, uploadFile, useMediaList, AddLinkModal, type MediaItem } from '../../../components/media-lib';

export default function MediaPage() {
  const { api } = useAuth();
  const toast = useToast();
  const { items, error, reload } = useMediaList();
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [linking, setLinking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      for (const file of files) await uploadFile(file, api);
      toast(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/media/${toDelete.id}`, { method: 'DELETE' });
      toast('Media deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete (may be in use)', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Library" title="Media">
        <button type="button" className="btn btn-ghost" onClick={() => setLinking(true)}>
          Add link
        </button>
        <button type="button" className="btn btn-red" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={onUpload} />
      </PageHeader>

      {error && <p className="mb-4 text-sm text-red">{error}</p>}

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No media yet"
          hint="Upload images and video for projects, clients, and the homepage."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={() => fileRef.current?.click()}>
              Upload media
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="group panel overflow-hidden rounded-xl">
              <div className="relative aspect-square">
                <MediaThumb item={m} className="h-full w-full" />
                <button
                  type="button"
                  onClick={() => setToDelete(m)}
                  className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity hover:bg-red group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
              <div className="truncate px-3 py-2 text-[12px] text-muted">{m.alt || m.type.toLowerCase()}</div>
            </div>
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete media?"
          body="This removes the file from the library. Items currently used by content cannot be deleted."
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {linking && (
        <AddLinkModal
          onClose={() => setLinking(false)}
          onAdded={() => {
            setLinking(false);
            toast('Media added');
            reload();
          }}
        />
      )}
    </div>
  );
}
