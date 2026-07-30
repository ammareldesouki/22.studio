import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Marquee } from '../marquee';

export async function ClientsWall({ locale, config = {} }: { locale: Locale; config?: { title?: string; maxItems?: number } }) {
  const t = await getTranslations('sections');
  let clients = await publicContent.listClients(locale);
  if (clients.length === 0) return null;
  if (config.maxItems && config.maxItems > 0) clients = clients.slice(0, config.maxItems);
  const items = clients.map((c) => ({ name: c.name, slug: c.slug, logoUrl: c.logoUrl, displayMode: c.displayMode }));
  const title = config.title?.trim() || t('trustedTitle');

  return (
    <section className="relative z-[2] border-y border-line bg-ink py-9">
      <p className="label mb-7 text-center !text-fg-strong">{title}</p>
      <Marquee items={items} />
    </section>
  );
}
