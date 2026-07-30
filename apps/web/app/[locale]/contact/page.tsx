import { setRequestLocale, getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Reveal } from '../../../components/reveal';
import { ContactForm } from '../../../components/contact-form';

export const revalidate = 300;

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const budgets = await publicContent.listBudgets(locale as Locale);

  return (
    <div className="min-h-screen pt-32">
      <section className="wrap grid gap-14 py-[clamp(48px,8vw,120px)] md:grid-cols-2 md:gap-20">
        <Reveal className="flex flex-col gap-5">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 className="text-[clamp(40px,6vw,88px)] text-fg-strong">{t('heading')}</h1>
          <p className="max-w-[36ch] text-[clamp(15px,1.3vw,18px)] text-muted">{t('sub')}</p>
          <div className="mt-6">
            <p className="label mb-3">{t('or')}</p>
            <a href="mailto:real22studio@gmail.com" className="block py-1 text-fg-strong transition-colors hover:text-red" data-cursor>
              real22studio@gmail.com
            </a>
            <a href="tel:+201080615075" className="block py-1 text-fg-strong transition-colors hover:text-red" data-cursor>
              +20 108 061 5075
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm budgets={budgets} />
        </Reveal>
      </section>
    </div>
  );
}
