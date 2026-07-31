'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Reveal } from '../reveal';

const SCENE =
  'radial-gradient(40% 60% at 72% 22%, rgba(255,210,120,0.9), transparent 60%), radial-gradient(60% 80% at 20% 90%, rgba(60,120,180,0.7), transparent 60%), linear-gradient(180deg,#2a3550,#0f1420 70%,#0a0d16)';

export function BeforeAfter({ config = {} }: { config?: { title?: string } }) {
  const t = useTranslations('sections');
  const heading = config.title?.trim() || t('baHeading');
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const set = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setPos(Math.max(4, Math.min(96, ((clientX - box.left) / box.width) * 100)));
  };

  return (
    <section id="beforeafter" className="relative z-[2] bg-ink py-[clamp(44px,6vw,88px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{t('baEyebrow')}</p>
          <h2 className="max-w-[18ch] text-[clamp(32px,5.5vw,72px)] text-white">{heading}</h2>
        </Reveal>
        <Reveal>
          <div
            ref={ref}
            onPointerDown={(e) => {
              dragging.current = true;
              set(e.clientX);
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => dragging.current && set(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            className="relative aspect-[16/8] touch-none select-none overflow-hidden border border-line"
            data-cursor="Drag"
          >
            <div className="absolute inset-0" style={{ background: SCENE, filter: 'grayscale(1) contrast(0.72) brightness(0.92) saturate(0)' }} />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
              <div className="absolute inset-0" style={{ background: SCENE, filter: 'contrast(1.18) saturate(1.35) brightness(1.04)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(232,25,44,0.14), transparent 45%, rgba(60,140,190,0.12))', mixBlendMode: 'overlay' }} />
            </div>

            <span className="absolute start-5 top-5 z-[3] bg-black/50 px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-muted backdrop-blur-sm">
              {t('raw')}
            </span>
            <span className="absolute end-5 top-5 z-[3] bg-black/50 px-3 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {t('edited')}
            </span>

            <div className="absolute bottom-0 top-0 z-[3] w-0.5 -translate-x-1/2 bg-white" style={{ left: `${pos}%` }} />
            <div
              className="absolute top-1/2 z-[4] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red text-lg text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
              style={{ left: `${pos}%` }}
            >
              ⇄
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
