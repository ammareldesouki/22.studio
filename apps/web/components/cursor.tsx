'use client';

import { useEffect, useRef } from 'react';

// A small red dot that grows into a labelled disc over elements carrying data-cursor="Label".
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = ref.current;
    if (!el || coarse || reduce) return;
    el.style.display = 'grid';

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
      if (target) {
        el.setAttribute('data-big', 'true');
        el.setAttribute('data-label', target.getAttribute('data-cursor') || '');
      } else {
        el.removeAttribute('data-big');
        el.removeAttribute('data-label');
      }
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', over);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
    };
  }, []);

  return <div ref={ref} className="cursor-dot" style={{ display: 'none' }} aria-hidden="true" />;
}
