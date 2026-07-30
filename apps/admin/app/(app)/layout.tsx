'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/auth-provider';
import { Sidebar } from '../../components/sidebar';
import { Topbar } from '../../components/topbar';
import { ToastProvider } from '../../components/toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  if (status !== 'authed') {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-white" />
          Loading…
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-6 py-7 md:px-8">
            <div className="mx-auto max-w-[1120px]">{children}</div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
