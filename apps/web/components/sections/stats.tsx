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

export function Stats() {
  const t = useTranslations('stats');
  const ts = useTranslations('sections');
  const items = t.raw('items') as { value: string; suffix: string; label: string }[];

  return (
    <section className="relative z-[2] bg-ink py-[clamp(72px,11vw,160px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('statsEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-white">{ts('statsHeading')}</h2>
        </Reveal>
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-5">
          {items.map((s, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="block font-display text-[clamp(40px,6vw,86px)] font-extrabold leading-none tracking-tight text-white">
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
