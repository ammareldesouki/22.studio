'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERMISSIONS } from '@studioflow/types';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, Modal, ConfirmDialog } from '../../../components/ui';

interface Role { id: string; name: string; permissions: string[]; isOwner: boolean; version: number }

const ALL = Object.values(PERMISSIONS);
// Group `module:action` permissions by module for a readable editor.
const GROUPS = ALL.reduce<Record<string, string[]>>((acc, p) => {
  const mod = p.split(':')[0] ?? p;
  (acc[mod] ??= []).push(p);
  return acc;
}, {});

export default function RolesPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Role[] | null>(null);
  const [editing, setEditing] = useState<Role | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<Role[]>('/api/roles')
      .then(setItems)
      .catch(() => toast('Could not load roles', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/roles/${toDelete.id}`, { method: 'DELETE' });
      toast('Role deleted');
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
      <PageHeader eyebrow="Studio" title="Roles">
        <button type="button" className="btn btn-red" onClick={() => setEditing('new')}>
          New role
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No roles yet" />
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <table className="dt">
            <thead>
              <tr>
                <th>Name</th>
                <th>Permissions</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-white">
                    {r.name}
                    {r.isOwner && <span className="ml-2 chip text-red">Owner</span>}
                  </td>
                  <td className="text-muted">{r.isOwner ? 'All permissions' : `${r.permissions.length} permissions`}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {!r.isOwner && (
                        <>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(r)}>
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(r)}>
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <RoleEditor
          role={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete role?"
          body={`“${toDelete.name}” will be removed. Roles assigned to users can't be deleted.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function RoleEditor({ role, onClose, onSaved }: { role: Role | null; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(role?.name ?? '');
  const [perms, setPerms] = useState<string[]>(role?.permissions ?? []);
  const [busy, setBusy] = useState(false);

  function toggle(p: string) {
    setPerms((v) => (v.includes(p) ? v.filter((x) => x !== p) : [...v, p]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (role) {
        await api(`/api/roles/${role.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim(), permissions: perms, version: role.version }) });
        toast('Role updated');
      } else {
        await api('/api/roles', { method: 'POST', body: JSON.stringify({ name: name.trim(), permissions: perms }) });
        toast('Role created');
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={role ? 'Edit role' : 'New role'} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="r-name">Name</label>
          <input id="r-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        <div className="field">
          <label>Permissions</label>
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(GROUPS).map(([mod, list]) => (
              <div key={mod} className="rounded-lg border border-line p-3">
                <div className="mb-2 eyebrow">{mod}</div>
                <div className="flex flex-col gap-1.5">
                  {list.map((p) => (
                    <label key={p} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <input type="checkbox" checked={perms.includes(p)} onChange={() => toggle(p)} className="accent-red" />
                      <span className={perms.includes(p) ? 'text-white' : 'text-muted'}>{p.split(':')[1]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Saving…' : role ? 'Save role' : 'Create role'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
