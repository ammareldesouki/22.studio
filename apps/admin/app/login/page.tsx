'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth-provider';

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === 'authed') router.replace('/');
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await login(email.trim(), password);
    setBusy(false);
    if (res.ok) router.replace('/');
    else setError(res.error || 'Login failed');
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-red font-display text-lg font-extrabold text-white">22</span>
          <div className="leading-tight">
            <div className="font-display text-sm font-bold tracking-tight">STUDIO</div>
            <div className="eyebrow">Content Manager</div>
          </div>
        </div>

        <div className="panel rounded-xl p-7">
          <h1 className="text-xl">Sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage projects, clients, and the public site.</p>

          <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-red">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-red mt-1" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
