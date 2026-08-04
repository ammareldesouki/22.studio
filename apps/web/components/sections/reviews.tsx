import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Reveal } from '../reveal';
import { ReviewForm } from '../review-form';

// Client reviews section (see docs/image.png): quote mark → review text → client name.
// Reviews are not localized — the same list renders on both /en and /ar. The section is
// the scroll target (id="reviews") for the hero "reviews" button.
export async function Reviews({
  locale: _locale,
  config = {},
}: {
  locale: Locale;
  config?: { title?: string; maxItems?: number };
}) {
  const ts = await getTranslations('sections');
  const tf = await getTranslations('reviewForm');
  let reviews = await publicContent.listReviews();
  if (config.maxItems && config.maxItems > 0) reviews = reviews.slice(0, config.maxItems);
  const heading = config.title?.trim() || ts('testimonialsHeading');

  return (
    <section id="reviews" className="relative z-[2] scroll-mt-24 bg-ink py-[clamp(44px,6vw,88px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(28px,4vw,48px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('testimonialsEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>

        {/* Public submission form, above the review cards. */}
        <Reveal className="mb-[clamp(36px,5vw,64px)] rounded-2xl border border-line bg-white/[0.03] p-7">
          <p className="mb-5 font-display text-[clamp(17px,1.8vw,22px)] font-semibold text-fg-strong">{tf('cta')}</p>
          <ReviewForm />
        </Reveal>

        {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.06}>
                <figure className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-white/[0.03] p-7">
                  <span aria-hidden="true" className="font-display text-6xl leading-none text-red">&ldquo;</span>
                  <blockquote className="text-[clamp(17px,1.8vw,21px)] leading-relaxed text-fg-strong">
                    {r.quote}
                  </blockquote>
                  <figcaption className="mt-auto font-display font-semibold text-fg-strong">
                    {r.authorName}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
