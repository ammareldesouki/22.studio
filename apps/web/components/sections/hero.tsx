'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { CmsLink } from '../cms-link';

const EASE = [0.16, 1, 0.3, 1] as const;

interface HeroConfig {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundUrl?: string | null;
}

export function Hero({ config = {} }: { config?: HeroConfig }) {
  const t = useTranslations('hero');
  // Eyebrow/tagline is CMS-editable: when the `eyebrow` key is set we use it verbatim
  // (an empty string means the admin deliberately hid it); when the key is absent we
  // fall back to the designed default from the translations.
  const eyebrow = (config.eyebrow === undefined ? t('eyebrow') : config.eyebrow).trim();
  const title = config.headline?.trim() || t('title');
  const sub = config.subheadline?.trim() || t('sub');
  const ctaText = config.ctaText?.trim() || t('cta');
  const ctaLink = config.ctaLink?.trim() || '/contact';
  const bg = config.backgroundUrl || null;

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden bg-ink pb-[clamp(48px,6vw,80px)]">
      {bg ? (
        <>
          <img src={bg} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        </>
      ) : (
        <div className="hero-bg absolute inset-0 -z-20" />
      )}

      {/* Signature circular red glow bleeding from the top-right corner (both themes). */}
      <div className="hero-glow absolute -top-[26vw] end-[-18vw] -z-10 h-[85vw] w-[85vw] rounded-full" aria-hidden="true" />

      <div className="wrap pt-32">
        {eyebrow ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="eyebrow mb-6">
            {eyebrow}
          </motion.p>
        ) : null}

        <h1 className="text-[clamp(44px,8.2vw,120px)] text-fg-strong">
          <span className="block overflow-hidden pb-[0.12em]">
            <motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.1 }} className="block">
              {title}
            </motion.span>
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
          className="mt-6 max-w-[36ch] text-[clamp(16px,1.5vw,21px)] leading-relaxed text-muted"
        >
          {sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.65 }}
          className="mt-9 flex flex-wrap items-center gap-7"
        >
          <CmsLink href={ctaLink} className="btn btn-red rounded-[2px]" cursor="Go">
            {ctaText}
          </CmsLink>
        </motion.div>
      </div>

      <div className="wrap mt-16 flex items-center justify-between">
        <span className="label !text-muted">↓ {t('scroll')}</span>
        <span className="label !text-muted">REEL 001 — SHOWREEL · 00:00</span>
      </div>
    </section>
  );
}
