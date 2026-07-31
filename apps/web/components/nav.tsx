'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, usePathname } from '../app/i18n/navigation';
import { ThemeToggle } from './theme';

export function Logo({ onClick, siteName, logoUrl }: { onClick?: () => void; siteName?: string; logoUrl?: string | null }) {
  const name = siteName?.trim() || 'STUDIO';
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-3" data-cursor aria-label={`${name} home`}>
      {/* CMS-uploaded logo when set, otherwise the real 22 Studio mark shipped in /public. */}
      <img src={logoUrl || '/logo.png'} alt={name} className="h-14 w-14 rounded-md object-contain" />
      <span className="font-display text-[19px] font-bold tracking-[0.04em] text-fg-strong">{name}</span>
    </Link>
  );
}

const LINKS = [
  ['/work', 'work'],
  ['/services', 'services'],
  ['/clients', 'clients'],
  ['/about', 'about'],
  ['/contact', 'contact'],
] as const;

interface SocialLink { label: string; href: string }

// Used only if Settings has no social links configured, so the menu is never empty.
const DEFAULT_SOCIAL: SocialLink[] = [
  { label: 'Instagram', href: 'https://instagram.com/_22visuals' },
];
const DEFAULT_EMAIL = 'real22studio@gmail.com';

export function Nav({ locale, social, email, siteName, logoUrl }: { locale: string; social?: SocialLink[]; email?: string | null; siteName?: string; logoUrl?: string | null }) {
  const socials = social && social.length ? social : DEFAULT_SOCIAL;
  const contactEmail = email || DEFAULT_EMAIL;
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const other = locale === 'ar' ? 'en' : 'ar';

  // Content slugs differ per locale, so switching language on a detail page (e.g.
  // /work/<slug>) would 404. Fall back to that section's list in the other locale.
  const parts = pathname.split('/').filter(Boolean);
  const localizedTarget = parts.length >= 2 && ['work', 'services', 'clients'].includes(parts[0] ?? '') ? `/${parts[0]}` : pathname;

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header
        className={`site-header fixed inset-x-0 top-0 z-[100] border-b transition-[background,padding,border-color] duration-500 ${
          stuck ? 'border-line bg-ink-deep/80 backdrop-blur-md' : 'border-transparent'
        }`}
      >
        <div className={`wrap flex items-center justify-between transition-[padding] duration-500 ${stuck ? 'py-3.5' : 'py-5'}`}>
          <Logo siteName={siteName} logoUrl={logoUrl} />
          <div className="flex items-center gap-5">
            <ThemeToggle />
            <Link href={localizedTarget} locale={other} className="label !text-fg-strong/90" data-cursor>
              {tc('switchLang')}
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2.5 font-display text-[13px] font-medium uppercase tracking-[0.14em] text-fg-strong"
              data-cursor
            >
              {t('menu')}
              <span className="relative block h-0.5 w-5 bg-fg-strong after:absolute after:-top-1.5 after:left-0 after:h-0.5 after:w-5 after:bg-fg-strong" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.3, 1] }}
            className="fixed inset-0 z-[110] bg-ink-deep"
          >
            <div className="wrap flex h-full flex-col py-5">
              <div className="flex items-center justify-between">
                <Logo onClick={() => setOpen(false)} siteName={siteName} logoUrl={logoUrl} />
                <button onClick={() => setOpen(false)} className="label !text-fg-strong" data-cursor>
                  {t('close')}
                </button>
              </div>
              <nav className="flex flex-1 flex-col justify-center gap-2">
                {LINKS.map(([href, key], i) => (
                  <motion.div
                    key={href}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className="font-display text-[clamp(40px,9vw,110px)] font-extrabold leading-[1.02] tracking-tight text-fg-strong transition-colors hover:text-red"
                      data-cursor
                    >
                      {t(key)}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-6">
                {socials.map((s) => (
                  <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className="label !text-fg-strong/80 hover:!text-red" data-cursor>
                    {s.label}
                  </a>
                ))}
                <a href={`mailto:${contactEmail}`} className="label !text-fg-strong/80 hover:!text-red" data-cursor>
                  {contactEmail}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
