'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '../../app/i18n/navigation';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden pb-[clamp(48px,6vw,80px)]">
      <div
        className="absolute inset-0 -z-20"
        style={{ background: 'radial-gradient(120% 90% at 78% 8%, #241014 0%, #141416 42%, #0e0e10 100%)' }}
      />
      <div
        className="absolute -top-[22vw] end-[-14vw] -z-10 h-[70vw] w-[70vw] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(232,25,44,0.4), transparent 62%)', filter: 'blur(30px)' }}
      />

      <div className="wrap pt-32">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="eyebrow mb-6"
        >
          {t('eyebrow')}
        </motion.p>

        <h1 className="text-[clamp(44px,8.2vw,120px)] text-white">
          <span className="block overflow-hidden pb-[0.12em]">
            <motion.span
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 1, ease: EASE, delay: 0.1 }}
              className="block"
            >
              {t('title')}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          className="mt-6 max-w-[36ch] text-[clamp(16px,1.5vw,21px)] leading-relaxed text-muted"
        >
          {t('sub')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
          className="mt-9 flex flex-wrap items-center gap-7"
        >
          <Link href="/contact" className="btn btn-red rounded-[2px]" data-cursor="Go">
            {t('cta')}
          </Link>
          <Link href="/work" className="flex items-center gap-2.5 text-sm text-muted" data-cursor>
            <span
              className="inline-block h-4 w-4 rounded-full"
              style={{ background: 'linear-gradient(90deg, #555 50%, #e8192c 50%)' }}
            />
            {t('watch')}
          </Link>
        </motion.div>
      </div>

      <div className="wrap mt-16 flex items-center justify-between">
        <span className="label !text-muted">↓ {t('scroll')}</span>
        <span className="label !text-muted">REEL 001 — SHOWREEL · 00:00</span>
      </div>
    </section>
  );
}
