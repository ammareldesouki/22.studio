'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Reveal } from '../reveal';

export function Process() {
  const t = useTranslations('process');
  const ts = useTranslations('sections');
  const items = t.raw('items') as { t: string; d: string }[];

  return (
    <section className="relative z-[2] bg-ink-deep py-[clamp(72px,11vw,160px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('processEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-white">{ts('processHeading')}</h2>
        </Reveal>
        <div className="grid gap-[clamp(18px,2vw,28px)] sm:grid-cols-2 md:grid-cols-5">
          {items.map((s, i) => (
            <Reveal key={i} delay={i * 0.08} className="relative border-t-2 border-line pt-[22px]">
              <motion.div
                className="absolute -top-0.5 left-0 h-0.5 bg-red"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true, margin: '-10%' }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.1 }}
              />
              <span className="font-display text-[13px] font-bold tracking-[0.1em] text-red">0{i + 1}</span>
              <h4 className="mt-3.5 font-display text-[clamp(18px,1.8vw,26px)] font-bold text-white">{s.t}</h4>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
