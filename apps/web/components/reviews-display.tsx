'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Reveal } from './reveal';

export interface ReviewItem {
  id: string;
  quote: string;
  authorName: string;
}

function Card({ quote, authorName }: { quote: string; authorName: string }) {
  return (
    <figure className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-white/[0.03] p-7">
      <span aria-hidden="true" className="font-display text-6xl leading-none text-red">&ldquo;</span>
      <blockquote className="text-[clamp(17px,1.8vw,21px)] leading-relaxed text-fg-strong">{quote}</blockquote>
      <figcaption className="mt-auto font-display font-semibold text-fg-strong">{authorName}</figcaption>
    </figure>
  );
}

// Reviews display: an auto-scrolling carousel by default (like the clients marquee, pausing
// on hover); a "Show all" toggle swaps to a static grid of every review.
export function ReviewsDisplay({ reviews }: { reviews: ReviewItem[] }) {
  const t = useTranslations('sections');
  const [showAll, setShowAll] = useState(false);

  if (reviews.length === 0) return null;

  // Duplicate the list so the marquee can loop seamlessly at translateX(-50%).
  const track = [...reviews, ...reviews, ...reviews, ...reviews];

  return (
    <div>
      {showAll ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06}>
              <Card quote={r.quote} authorName={r.authorName} />
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden">
          <div className="marquee-cards">
            {track.map((r, i) => (
              <div key={i} className="w-[clamp(280px,80vw,360px)] shrink-0">
                <Card quote={r.quote} authorName={r.authorName} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-[clamp(28px,4vw,44px)] flex justify-center">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="btn btn-ghost rounded-[2px]"
          data-cursor={showAll ? 'Less' : 'All'}
        >
          {showAll ? t('reviewsShowLess') : t('reviewsShowAll')}
        </button>
      </div>
    </div>
  );
}
