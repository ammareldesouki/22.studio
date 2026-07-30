import { getTranslations } from 'next-intl/server';
import { Reveal } from '../reveal';

export async function Faq({ config = {} }: { config?: { title?: string; items?: { question?: string; answer?: string }[] } }) {
  const t = await getTranslations('faq');
  const ts = await getTranslations('sections');
  const fallback = t.raw('items') as { q: string; a: string }[];
  const items =
    config.items && config.items.length > 0
      ? config.items.map((it) => ({ q: it.question ?? '', a: it.answer ?? '' }))
      : fallback;
  const heading = config.title?.trim() || ts('faqHeading');

  return (
    <section className="relative z-[2] bg-ink py-[clamp(72px,11vw,160px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('faqEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>
        <Reveal>
          <div className="border-t border-line">
            {items.map((it, i) => (
              <details key={i} className="group border-b border-line" {...(i === 0 ? { open: true } : {})}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-6 font-display text-[clamp(17px,1.8vw,23px)] font-semibold text-fg-strong [&::-webkit-details-marker]:hidden">
                  {it.q}
                  <span className="text-2xl font-normal text-red transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-[66ch] pb-6 text-[15.5px] leading-relaxed text-muted">{it.a}</p>
              </details>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
