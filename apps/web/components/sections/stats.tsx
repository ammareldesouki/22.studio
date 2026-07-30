'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInView } from 'framer-motion';
import { Reveal } from '../reveal';

function Counter({ value, suffix }: { value: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });
  const [n, setN] = useState(0);
  const target = parseFloat(value) || 0;

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    let raf = 0;
    let t0 = 0;
    const dur = 1400;
    const loop = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / dur, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref} className="font-variant-numeric tabular-nums">
      {n}
      <em className="not-italic text-red">{suffix}</em>
    </span>
  );
}

// Split a display value like "150+" or "4.9/5" into a numeric part (for the counter) and a suffix.
function splitValue(v: string): { value: string; suffix: string } {
  const m = /^\s*([\d.]+)(.*)$/.exec(v);
  return m ? { value: m[1] ?? '0', suffix: (m[2] ?? '').trim() } : { value: '0', suffix: v };
}

export function Stats({ config = {} }: { config?: { title?: string; items?: { label?: string; value?: string }[] } }) {
  const t = useTranslations('stats');
  const ts = useTranslations('sections');
  const fallback = t.raw('items') as { value: string; suffix: string; label: string }[];
  const items =
    config.items && config.items.length > 0
      ? config.items.map((it) => ({ ...splitValue(it.value ?? ''), label: it.label ?? '' }))
      : fallback;
  const heading = config.title?.trim() || ts('statsHeading');

  return (
    <section className="relative z-[2] bg-ink py-[clamp(72px,11vw,160px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('statsEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-5">
          {items.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="block font-display text-[clamp(40px,6vw,86px)] font-extrabold leading-none tracking-tight text-fg-strong">
                <Counter value={s.value} suffix={s.suffix} />
              </div>
              <span className="mt-3.5 block font-display text-[13px] font-medium uppercase tracking-[0.06em] text-muted">{s.label}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
