'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import gsap from 'gsap';

// Video-timeline clips scrubbed in the intro — ratios/colours mirror the source design.
const CLIPS = [
  { flex: 1.2, className: 'bg-fg-strong' },
  { flex: 0.8, className: 'bg-red' },
  { flex: 1.5, className: 'bg-fg/20 border-[0.5px] border-line' },
  { flex: 1, className: 'bg-muted' },
  { flex: 0.9, className: 'bg-fg-strong/80' },
];

/**
 * Homepage intro. Plays a timeline-scrub animation over a full-screen overlay,
 * reveals the 22 Studio logo + tagline, then slides up to hand off to the site.
 * Skipped entirely under prefers-reduced-motion. Renders only on the homepage.
 */
export function IntroOverlay() {
  const t = useTranslations('intro');
  const [done, setDone] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const timelineWrapRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true);
      return;
    }

    // Lock scroll while the intro owns the viewport; released on cleanup.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const ctx = gsap.context(() => {
      gsap.set('.intro-clip', { scaleY: 1, transformOrigin: 'center' });
      gsap.set(headingRef.current, { opacity: 0 });
      gsap.set(playheadRef.current, { left: '0%' });

      gsap
        .timeline()
        .to(playheadRef.current, { left: '100%', duration: 1.1, ease: 'power1.inOut' })
        .to('.intro-clip', { scaleY: 0, duration: 0.5, ease: 'power3.in', stagger: 0.06 }, '-=0.4')
        .to(timelineWrapRef.current, { opacity: 0, duration: 0.3 }, '-=0.2')
        .to(headingRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        .to({}, { duration: 0.5 }) // hold on the reveal
        .to(overlayRef.current, {
          yPercent: -100,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => setDone(true),
        });
    }, overlayRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (done) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[200] bg-ink" aria-hidden="true">
      {/* Reveal: logo (no card, sits on the dark bg) + tagline, fades in after the scrub. */}
      <div ref={headingRef} className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-6 text-fg-strong opacity-0 sm:gap-8">
        <img src="/intro-logo.png" alt="22 Studio" className="h-32 w-auto object-contain sm:h-40" />
        {/* Wraps + scales down on mobile so it never overflows; one line at 40px on ≥sm. */}
        <div className="max-w-[14ch] text-center text-[clamp(24px,7vw,40px)] font-bold leading-tight sm:max-w-none sm:whitespace-nowrap">
          {t('tagline')}
        </div>
      </div>

      {/* Timeline: clip track + waveform + scrubbing playhead (centered, fixed-direction). */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div dir="ltr" ref={timelineWrapRef} className="relative flex h-[280px] w-full max-w-[480px] flex-col justify-center gap-1.5 px-5">
          <div className="flex h-11 gap-0.5">
            {CLIPS.map((c, i) => (
              <div key={i} className={`intro-clip rounded-[3px] ${c.className}`} style={{ flex: c.flex }} />
            ))}
          </div>
          <div className="flex h-5 opacity-60">
            <svg width="100%" height="20" preserveAspectRatio="none" viewBox="0 0 400 20">
              <polyline
                points="0,10 10,4 20,15 30,6 40,12 50,3 60,16 70,8 80,10 90,5 100,14 110,7 120,11 130,4 140,16 150,9 160,12 170,6 180,10 190,3 200,15 210,8 220,11 230,5 240,13 250,9 260,10 270,4 280,15 290,7 300,11 310,6 320,12 330,9 340,10 350,5 360,14 370,8 380,11 390,6 400,10"
                fill="none"
                stroke="#E8192C"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div ref={playheadRef} className="absolute inset-y-0 left-0 w-0.5 bg-[#E8192C] shadow-[0_0_6px_rgba(232,25,44,0.6)]" />
        </div>
      </div>
    </div>
  );
}
