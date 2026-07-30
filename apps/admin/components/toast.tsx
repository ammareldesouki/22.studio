'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';

interface Toast { id: number; kind: 'success' | 'error'; text: string }
interface ToastCtx { toast: (text: string, kind?: 'success' | 'error') => void }

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, kind: 'success' | 'error' = 'success') => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto min-w-[220px] rounded-lg border px-4 py-3 text-sm shadow-xl ${
              t.kind === 'error' ? 'border-red/40 bg-[#2a1416] text-red' : 'border-emerald-500/30 bg-[#122019] text-emerald-300'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c.toast;
}
