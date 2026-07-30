'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface Role { name: string; permissions: string[]; isOwner: boolean }
export interface User { id: string; name: string; email: string; role: Role }
type Status = 'loading' | 'authed' | 'anon';

type ApiError = Error & { status?: number; data?: unknown };

interface Ctx {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  api: <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
  can: (perm: string) => boolean;
}

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const tokenRef = useRef<string | null>(null);

  const doRefresh = useCallback(async () => {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return false;
    const { accessToken } = await res.json();
    tokenRef.current = accessToken;
    return true;
  }, []);

  const loadMe = useCallback(async () => {
    const res = await fetch('/api/auth/me', { headers: { authorization: `Bearer ${tokenRef.current}` } });
    if (!res.ok) return false;
    setUser(await res.json());
    return true;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = (await doRefresh()) && (await loadMe());
      if (alive) setStatus(ok ? 'authed' : 'anon');
    })();
    return () => {
      alive = false;
    };
  }, [doRefresh, loadMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        return { ok: false, error: (j as { error?: string }).error || 'Login failed' };
      }
      const { accessToken } = await res.json();
      tokenRef.current = accessToken;
      await loadMe();
      setStatus('authed');
      return { ok: true };
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', headers: { authorization: `Bearer ${tokenRef.current}` } }).catch(() => undefined);
    tokenRef.current = null;
    setUser(null);
    setStatus('anon');
  }, []);

  const api = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const build = (): RequestInit => {
        const headers: Record<string, string> = { authorization: `Bearer ${tokenRef.current}`, ...(init.headers as Record<string, string>) };
        if (init.body && typeof init.body === 'string' && !headers['content-type']) headers['content-type'] = 'application/json';
        return { ...init, headers };
      };
      let res = await fetch(path, build());
      if (res.status === 401 && (await doRefresh())) res = await fetch(path, build());
      if (res.status === 401) {
        setStatus('anon');
        setUser(null);
        throw Object.assign(new Error('Unauthorized'), { status: 401 }) as ApiError;
      }
      const ct = res.headers.get('content-type') || '';
      const data = res.status === 204 ? null : ct.includes('json') ? await res.json() : await res.text();
      if (!res.ok) {
        throw Object.assign(new Error((data as { error?: string })?.error || 'Request failed'), { status: res.status, data }) as ApiError;
      }
      return data as T;
    },
    [doRefresh],
  );

  const can = useCallback(
    (perm: string) => !!user && (user.role.isOwner || user.role.permissions.includes(perm)),
    [user],
  );

  return <AuthContext.Provider value={{ user, status, login, logout, api, can }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
