import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Link } from '../../i18n/navigation';
import { Reveal } from '../../../components/reveal';
import { CtaBanner } from '../../../components/sections/cta-banner';

export const revalidate = 300;

export default async function ClientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('clients');
  const ts = await getTranslations('services');
  const clients = await publicContent.listClients(l);

  return (
    <>
      <div className="pt-32">
        <section className="wrap py-[clamp(48px,8vw,110px)]">
          <Reveal className="flex flex-col gap-4">
            <p className="eyebrow">{t('title')}</p>
            <h1 className="text-[clamp(40px,7vw,100px)] text-fg-strong">{t('heading')}</h1>
            <p className="max-w-[40ch] text-[clamp(15px,1.3vw,18px)] text-muted">{t('sub')}</p>
          </Reveal>
        </section>
        <section className="wrap pb-[clamp(72px,11vw,140px)]">
          <Reveal>
            <div className="grid grid-cols-2 gap-[clamp(12px,1.5vw,20px)] md:grid-cols-4">
              {clients.map((c) => {
                const showLogo = c.displayMode !== 'name' && !!c.logoUrl;
                const showName = c.displayMode !== 'logo' || !c.logoUrl;
                return (
                <Link
                  key={c.id}
                  href={`/clients/${c.slug}`}
                  data-cursor
                  className="group flex aspect-[4/3] flex-col justify-between border border-line p-6 transition-colors duration-300 hover:border-red"
                >
                  <div className="flex flex-col gap-3">
                    {showLogo && (
                      <img
                        src={c.logoUrl as string}
                        alt={showName ? '' : c.name}
                        className="max-h-[clamp(32px,4vw,56px)] w-auto self-start object-contain opacity-80 grayscale transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                      />
                    )}
                    {showName && <span className="font-display text-[clamp(20px,2.2vw,30px)] font-extrabold leading-none text-fg-strong">{c.name}</span>}
                  </div>
                  <span className="label !text-muted transition-colors group-hover:!text-red">
                    {ts('projectCount', { count: c.projectCount })}
                  </span>
                </Link>
                );
              })}
            </div>
          </Reveal>
        </section>
      </div>
      <CtaBanner />
    </>
  );
}
