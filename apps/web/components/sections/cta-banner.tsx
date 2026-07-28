import { getTranslations } from 'next-intl/server';
import { Link } from '../../app/i18n/navigation';
import { Reveal } from '../reveal';

export async function CtaBanner() {
  const t = await getTranslations('sections');

  return (
    <section className="relative z-[2] overflow-hidden bg-ink py-[clamp(80px,12vw,180px)] text-center">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(60% 100% at 50% 120%, rgba(232,25,44,0.32), transparent 60%)' }}
      />
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-6 block">{t('ctaEyebrow')}</p>
        </Reveal>
        <Reveal>
          <h2 className="mx-auto max-w-[16ch] text-[clamp(40px,8vw,112px)] text-white">{t('ctaHeading')}</h2>
        </Reveal>
        <Reveal>
          <div className="mt-11 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn btn-red rounded-[2px]" data-cursor="Go">
              {t('ctaPrimary')}
            </Link>
            <Link href="/work" className="btn btn-ghost rounded-[2px]" data-cursor>
              {t('ctaSecondary')}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
