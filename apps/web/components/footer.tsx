import { getTranslations } from 'next-intl/server';
import { Link } from '../app/i18n/navigation';
import { Logo } from './nav';

interface SocialLink { label: string; href: string }

const DEFAULT_SOCIAL: SocialLink[] = [{ label: 'Instagram', href: 'https://instagram.com/_22visuals' }];
const DEFAULT_EMAIL = 'real22studio@gmail.com';
const DEFAULT_PHONE = '+20 108 061 5075';

export async function Footer({
  social,
  email,
  phone,
  siteName,
  logoUrl,
}: {
  social?: SocialLink[];
  email?: string | null;
  phone?: string | null;
  siteName?: string;
  logoUrl?: string | null;
} = {}) {
  const t = await getTranslations('footer');
  const n = await getTranslations('nav');
  const socials = social && social.length ? social : DEFAULT_SOCIAL;
  const contactEmail = email || DEFAULT_EMAIL;
  const contactPhone = phone || DEFAULT_PHONE;

  return (
    <footer className="relative z-[2] border-t border-line bg-ink-deep py-[clamp(56px,7vw,90px)]">
      <div className="wrap">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1.4fr]">
          <div>
            <Logo siteName={siteName} logoUrl={logoUrl} />
            <p className="mt-5 max-w-[30ch] text-sm text-muted">{t('tagline')}</p>
          </div>

          <div>
            <h5 className="label mb-4">{t('studio')}</h5>
            <FLink href="/work">{n('work')}</FLink>
            <FLink href="/services">{n('services')}</FLink>
            <FLink href="/clients">{n('clients')}</FLink>
            <FLink href="/about">{n('about')}</FLink>
          </div>

          <div>
            <h5 className="label mb-4">{t('social')}</h5>
            {socials.map((s) => (
              <FExt key={s.href} href={s.href}>
                {s.label}
              </FExt>
            ))}
          </div>

          <div>
            <h5 className="label mb-4">{t('startProject')}</h5>
            <FExt href={`mailto:${contactEmail}`}>{contactEmail}</FExt>
            <FExt href={`tel:${contactPhone.replace(/\s+/g, '')}`}>{contactPhone}</FExt>
          </div>
        </div>

        <div className="mt-[clamp(48px,6vw,80px)] flex flex-wrap justify-between gap-3 border-t border-line pt-6 text-[13px] text-muted">
          <span className="label !text-muted">{t('rights')}</span>
          <span className="label !text-muted">{t('services')}</span>
        </div>
      </div>
    </footer>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block py-1.5 text-[15px] text-fg transition-colors hover:text-red" data-cursor>
      {children}
    </Link>
  );
}

function FExt({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="block py-1.5 text-[15px] text-fg transition-colors hover:text-red" data-cursor>
      {children}
    </a>
  );
}
