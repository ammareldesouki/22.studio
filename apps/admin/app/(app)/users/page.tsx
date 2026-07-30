'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, Modal, ConfirmDialog } from '../../../components/ui';

interface User { id: string; name: string; email: string; roleId: string; active: boolean; version: number }
interface Role { id: string; name: string }

export default function UsersPage() {
  const { api, user: me } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<User[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [pwFor, setPwFor] = useState<User | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<User[]>('/api/users')
      .then(setItems)
      .catch(() => toast('Could not load users', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
    api<Role[]>('/api/roles').then(setRoles).catch(() => undefined);
  }, [reload, api]);

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? '—';

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/users/${toDelete.id}`, { method: 'DELETE' });
      toast('User deleted');
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
      <PageHeader eyebrow="Studio" title="Team">
        <button type="button" className="btn btn-red" onClick={() => setEditing('new')}>
          Invite user
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <div className="panel overflow-hidden rounded-xl">
          <table className="dt">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium text-white">
                    {u.name}
                    {u.id === me?.id && <span className="ml-2 chip">You</span>}
                  </td>
                  <td className="text-muted">{u.email}</td>
                  <td>{roleName(u.roleId)}</td>
                  <td>
                    <span className={`pill ${u.active ? 'pill-published' : 'pill-archived'}`}>{u.active ? 'active' : 'inactive'}</span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(u)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPwFor(u)}>
                        Password
                      </button>
                      {u.id !== me?.id && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(u)}>
                          Delete
                        </button>
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
        <UserEditor
          user={editing === 'new' ? null : editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {pwFor && <PasswordModal user={pwFor} onClose={() => setPwFor(null)} />}
      {toDelete && (
        <ConfirmDialog
          title="Delete user?"
          body={`${toDelete.name} will lose access immediately.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

function UserEditor({ user, roles, onClose, onSaved }: { user: User | null; roles: Role[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(user?.roleId ?? roles[0]?.id ?? '');
  const [active, setActive] = useState(user?.active ?? true);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (user) {
        await api(`/api/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim(), roleId, active, version: user.version }) });
        toast('User updated');
      } else {
        await api('/api/users', { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password, roleId }) });
        toast('User created');
      }
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={user ? 'Edit user' : 'Invite user'} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="u-name">Name</label>
          <input id="u-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </div>
        {!user && (
          <>
            <div className="field">
              <label htmlFor="u-email">Email</label>
              <input id="u-email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="u-pw">Temporary password</label>
              <input id="u-pw" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="u-role">Role</label>
          <select id="u-role" className="input" value={roleId} onChange={(e) => setRoleId(e.target.value)} required>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        {user && (
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-red" />
            Active
          </label>
        )}
        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Saving…' : user ? 'Save' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/users/${user.id}/password`, { method: 'POST', body: JSON.stringify({ password }) });
      toast('Password updated');
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not update', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={`Set password — ${user.name}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="field">
          <label htmlFor="np">New password</label>
          <input id="np" type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus />
        </div>
        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-red btn-sm" disabled={busy}>
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
