# Intro Animation + Real Logo — Design

**Date:** 2026-07-30
**App:** `apps/web` (22 Studio public website)
**Status:** Approved

## Summary

Add a cinematic intro animation that plays on the homepage, then hands off to
the real website via an auto slide-up reveal. Also promote the real 22 Studio
logo — currently embedded only as a base64 PNG inside
`timeline_scrub_real_logo_v2.html` — into a real asset used across the nav,
footer, favicon, and the intro itself.

## Decisions (from brainstorming)

- **Frequency:** Every homepage load (no session/localStorage gating).
- **Scope:** Homepage only (`/[locale]`). Inner routes load with no intro.
- **Handoff:** Auto scroll-down reveal — overlay slides up and off to reveal the
  homepage underneath, no user action required.
- **Logo usage:** Nav bar, footer, browser-tab favicon, and the intro.
- **Animation library:** Add `gsap` as a dependency and reuse the source
  timeline (Approach A).

## Part 1 — Logo asset

Today the logo exists only as base64 inside the animation HTML. The shared
`Logo` component (`components/nav.tsx`, also consumed by `components/footer.tsx`)
falls back to a red "22" box when the CMS `settings.logoUrl` is null.

Changes:

1. Decode the embedded PNG once into:
   - `apps/web/public/logo.png` — used by nav/footer fallback and the intro.
   - `apps/web/app/icon.png` — auto-detected by Next App Router as the favicon.
2. Update the `Logo` component so its **fallback** renders `/logo.png` instead
   of the "22" box. A CMS-uploaded `logoUrl` still overrides it — this only
   changes the default. Keeps the existing size/border styling
   (`h-10 w-10 rounded-md`).
3. Nav ✅, footer ✅ (both use `Logo`), favicon ✅ (static `app/icon.png`),
   intro ✅ — all sourced from the one decoded asset.

The layout already sets `icons` from `settings.faviconUrl` when present; the
static `app/icon.png` acts as the default when the CMS provides none.

## Part 2 — Intro overlay

New client component: `apps/web/components/intro/intro-overlay.tsx`.

Rendered only from `apps/web/app/[locale]/page.tsx` (homepage), so inner routes
never mount it.

### Structure

- Full-screen `fixed inset-0 z-[200]` overlay (above the nav's `z-100`),
  background `#111`.
- Reproduces the source `#stage`: a video-timeline of colored clips
  (white / red `#E8192C` / near-black / grey), a waveform row, and a red
  playhead; plus a hidden `#heading` block containing `/logo.png` and the
  reveal copy.

### Timeline (GSAP, mirrors the source)

1. Playhead `left: 0% → 100%` over ~1.1s (`power1.inOut`).
2. Clips collapse `scaleY: 1 → 0`, staggered ~0.06s (`power3.in`), starting
   ~0.4s before the playhead finishes.
3. `#timelineWrap` fades to `opacity: 0` (~0.3s).
4. `#heading` (logo + copy) fades to `opacity: 1` (~0.5s, `power2.out`).
5. Hold ~0.5s.
6. Whole overlay slides up `translateY: 0 → -100%` (~0.8s ease) revealing the
   homepage, then unmounts.

### Scroll lock

- On mount, lock body scroll (`document.body.style.overflow = 'hidden'`).
- Release when the overlay finishes sliding away / unmounts.
- Because the intro runs on top and Lenis smooth-scroll is already active
  underneath, the lock prevents scroll bleed during the intro.

### Reduced motion

- If `window.matchMedia('(prefers-reduced-motion: reduce)').matches`, the intro
  does not mount at all (returns null, no scroll lock) — consistent with how
  `SmoothScroll` already bails. Homepage renders immediately.

### i18n

- The reveal copy ("We make your visuals hit harder.") is added to
  `apps/web/messages/en.json` and `apps/web/messages/ar.json` under an `intro`
  namespace and read via `useTranslations('intro')`, so it renders correctly in
  EN and AR (RTL).

## Files touched

- `apps/web/public/logo.png` — new (decoded asset).
- `apps/web/app/icon.png` — new (favicon).
- `apps/web/components/nav.tsx` — `Logo` fallback → `/logo.png`.
- `apps/web/components/intro/intro-overlay.tsx` — new client component.
- `apps/web/app/[locale]/page.tsx` — render `<IntroOverlay />` on the homepage.
- `apps/web/messages/en.json`, `apps/web/messages/ar.json` — `intro.tagline`.
- `apps/web/package.json` — add `gsap` dependency.

## Out of scope

- Session/once-ever gating (explicitly chose every load).
- Intro on inner routes.
- Shared-element "logo flies into nav" transition.
- Changing the CMS logo pipeline (only the fallback changes).

## Success criteria

- Visiting `/en` or `/ar` plays the intro, then slides up to reveal the
  homepage; body scroll is locked during and released after.
- Inner routes (`/work`, `/services`, ...) show no intro.
- Nav, footer, and favicon show the real logo when the CMS has no uploaded logo.
- `prefers-reduced-motion: reduce` skips the intro entirely.
- Reveal copy is correct in both EN and AR.
