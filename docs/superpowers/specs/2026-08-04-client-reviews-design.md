# Client Reviews — Design

**Date:** 2026-08-04
**Status:** Approved (ready for implementation plan)

## Goal

Add client reviews (testimonials) to the 22 Studio marketing site:

- A homepage **reviews section** styled like `docs/image.png` — a big quote mark, the
  review text, and the client's name underneath. No avatar, no @handle.
- A second **hero button** ("review us") next to the existing CTA. Its label is
  admin-editable; when the label is blank the button is hidden. Clicking it scroll-jumps
  to the reviews section.
- An **admin "Reviews" section** to add, edit, reorder, show/hide, and delete reviews.

## Key decisions

- **One review = one quote + one name.** The review text is a single value shown *as-is*
  on both the English and Arabic sites. Reviews are **not localized and not split** by
  language — no `quoteEn`/`quoteAr`, no per-locale rows. The same review list renders
  identically on `/en` and `/ar`.
- **Lightweight model.** Reviews are not pages, so they follow the `Budget` pattern
  (single row, `active` boolean, `order`) — *not* the heavy content-engine entities
  (`Client`, `Testimonial`) with SEO/slug/version. The existing empty `Testimonial`
  content-engine shell is left untouched and unused.
- **Hide semantics:** `active = false` hides a review from the site (reversible toggle in
  admin). Hard delete is also available.

## 1. Data model

New Prisma model in `packages/db/prisma/schema.prisma`:

```prisma
model Review {
  id         String   @id @default(uuid()) @db.Uuid
  quote      String              // the review text — one value, shown on both EN & AR
  authorName String              // client name
  order      Int      @default(0)
  active     Boolean  @default(true)   // false = hidden from site
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([order])
  @@index([active])
}
```

Migration created via the Prisma `directUrl` (5432) path, per project DB conventions.

## 2. Admin — Reviews manager

- **Page:** `apps/admin/app/(app)/reviews/page.tsx`, mirroring the Clients manager UX
  (list, add/edit modal, reorder, status toggle, confirm-delete). New `Reviews` entry in
  the admin sidebar nav.
- **API routes** (mirror `/api/budgets`):
  - `apps/admin/app/api/reviews/route.ts` — `GET` (list, ordered) and `POST` (create).
  - `apps/admin/app/api/reviews/[id]/route.ts` — `PATCH` (update fields / toggle `active`)
    and `DELETE` (hard delete).
  - `apps/admin/app/api/reviews/reorder/route.ts` — `POST` reorder (mirror
    `/api/budgets` or `/api/clients/reorder`).
  - Auth guarded the same way as the other admin API routes.
- **Editor modal fields:** Review text (required, multiline), Client name (required),
  Show/Hide toggle (`active`), Delete action.
- **Validation:** Zod schema in `packages/validation` (alongside the existing modules),
  e.g. `review` create/update schemas — `quote` non-empty, `authorName` non-empty,
  `order` int, `active` boolean.

## 3. Public — reviews section

- **Data:** `publicContent.listReviews()` in `packages/core/src/public/index.ts`.
  No locale argument. Returns `{ id, quote, authorName }[]` for all `active` reviews,
  ordered by `order` asc then `createdAt`. Same result on both locales.
- **Component:** `apps/web/components/sections/reviews.tsx`.
  - Section wrapper carries `id="reviews"` (scroll target for the hero button).
  - Eyebrow ("Testimonial") + heading from translation strings in
    `apps/web/messages/en.json` and `apps/web/messages/ar.json` (new `reviews` namespace).
  - Cards: big quote mark ❝ → review text → client name. Responsive grid, 3-up on
    desktop, stacked on mobile. Follows existing section styling conventions.
  - Renders nothing if there are no active reviews.
- **Wiring in `apps/web/app/[locale]/page.tsx`:**
  - `renderSection` `TESTIMONIALS` case renders `<Reviews />` (currently renders nothing).
  - `DefaultHome` fallback includes `<Reviews />` (placement: after `CtaBanner` or an
    agreed spot — see open note below).
  - The reviews list is fetched fresh from the `Review` table, independent of the
    homepage-section config rows.

## 4. Hero button

- Add `reviewsCtaText?: string` to `HeroConfig` in
  `apps/web/components/sections/hero.tsx`.
- Render a **second button** next to the existing CTA, inside the same button row, linking
  to `#reviews` (in-page scroll; smooth-scroll already exists in the app).
- **Hide-when-empty:** identical to the existing `eyebrow` behavior — trim
  `reviewsCtaText`; render the button only when non-empty. Absent/blank ⇒ no button.
- Editable in the admin homepage **HERO** section editor, where `ctaText`/`ctaLink`
  already live (add the `reviewsCtaText` field there; extend the HERO config validation in
  `packages/validation/src/homepage.ts` if it enumerates keys).

## Out of scope (YAGNI)

- No avatar/photo uploads, no @handles, no role/company subtitle.
- No per-review localized text or names.
- No carousel / auto-play / pagination dots — a static responsive grid. (Can be added
  later if the dotted carousel from the reference image is wanted.)
- The existing `Testimonial` content-engine model is not extended or removed.

## Open notes (resolve during implementation)

- Exact placement of the reviews section in the `DefaultHome` fallback order (proposed:
  after `Faq`, before `CtaBanner`, so the CTA stays last). Confirm during build.
- Section heading copy for EN/AR translation strings (proposed EN: eyebrow "Testimonial",
  heading "What our clients say"; AR equivalents).
