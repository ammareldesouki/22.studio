'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, usePathname } from '../app/i18n/navigation';

export function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/" onClick={onClick} className="flex items-center gap-3" data-cursor aria-label="22 Studio home">
      <span className="grid h-10 w-10 place-items-center bg-red font-display text-[22px] font-extrabold leading-none tracking-tighter text-white">
        22
      </span>
      <span className="font-display text-[19px] font-bold tracking-[0.04em] text-white">STUDIO</span>
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

export function Nav({ locale }: { locale: string }) {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const other = locale === 'ar' ? 'en' : 'ar';

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
        className={`fixed inset-x-0 top-0 z-[100] border-b transition-[background,padding,border-color] duration-500 ${
          stuck ? 'border-line bg-ink-deep/80 backdrop-blur-md' : 'border-transparent'
        }`}
      >
        <div className={`wrap flex items-center justify-between transition-[padding] duration-500 ${stuck ? 'py-3.5' : 'py-5'}`}>
          <Logo />
          <div className="flex items-center gap-7">
            <Link href={pathname} locale={other} className="label !text-white/90" data-cursor>
              {tc('switchLang')}
            </Link>
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2.5 font-display text-[13px] font-medium uppercase tracking-[0.14em] text-white"
              data-cursor
            >
              {t('menu')}
              <span className="relative block h-0.5 w-5 bg-white after:absolute after:-top-1.5 after:left-0 after:h-0.5 after:w-5 after:bg-white" />
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
                <Logo onClick={() => setOpen(false)} />
                <button onClick={() => setOpen(false)} className="label !text-white" data-cursor>
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
                      className="font-display text-[clamp(40px,9vw,110px)] font-extrabold leading-[1.02] tracking-tight text-white transition-colors hover:text-red"
                      data-cursor
                    >
                      {t(key)}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-6">
                <a href="https://instagram.com/22studi" className="label !text-white/80 hover:!text-red" data-cursor>Instagram</a>
                <a href="https://tiktok.com/@_22studio" className="label !text-white/80 hover:!text-red" data-cursor>TikTok</a>
                <a href="https://vimeo.com/real22studio" className="label !text-white/80 hover:!text-red" data-cursor>Vimeo</a>
                <a href="mailto:real22studio@gmail.com" className="label !text-white/80 hover:!text-red" data-cursor>real22studio@gmail.com</a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
