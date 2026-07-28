import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Marquee } from '../marquee';

export async function ClientsWall({ locale }: { locale: Locale }) {
  const t = await getTranslations('sections');
  const clients = await publicContent.listClients(locale);
  if (clients.length === 0) return null;
  const items = clients.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <section className="relative z-[2] border-y border-line bg-ink py-9">
      <p className="label mb-7 text-center !text-white">{t('trustedTitle')}</p>
      <Marquee items={items} />
    </section>
  );
}
