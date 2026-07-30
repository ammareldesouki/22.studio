import { getTranslations } from 'next-intl/server';
import { Link } from '../../app/i18n/navigation';
import { Reveal } from '../reveal';
import { CmsLink } from '../cms-link';

interface CtaConfig { headline?: string; subheadline?: string; buttonText?: string; buttonLink?: string }

export async function CtaBanner({ config = {} }: { config?: CtaConfig }) {
  const t = await getTranslations('sections');
  const heading = config.headline?.trim() || t('ctaHeading');
  const sub = config.subheadline?.trim();
  const primaryText = config.buttonText?.trim() || t('ctaPrimary');
  const primaryLink = config.buttonLink?.trim() || '/contact';

  return (
    <section data-theme="dark" className="relative z-[2] overflow-hidden bg-ink py-[clamp(80px,12vw,180px)] text-center">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: 'radial-gradient(60% 100% at 50% 120%, rgba(232,25,44,0.32), transparent 60%)' }}
      />
      <div className="wrap">
        <Reveal>
          <p className="eyebrow mb-6 block">{t('ctaEyebrow')}</p>
        </Reveal>
        <Reveal>
          <h2 className="mx-auto max-w-[16ch] text-[clamp(40px,8vw,112px)] text-fg-strong">{heading}</h2>
        </Reveal>
        {sub && (
          <Reveal>
            <p className="mx-auto mt-6 max-w-[46ch] text-[clamp(15px,1.4vw,19px)] text-muted">{sub}</p>
          </Reveal>
        )}
        <Reveal>
          <div className="mt-11 flex flex-wrap justify-center gap-4">
            <CmsLink href={primaryLink} className="btn btn-red rounded-[2px]" cursor="Go">
              {primaryText}
            </CmsLink>
            <Link href="/work" className="btn btn-ghost rounded-[2px]" data-cursor>
              {t('ctaSecondary')}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
