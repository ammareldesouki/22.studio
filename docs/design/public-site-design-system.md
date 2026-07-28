# 22 STUDIO — Public Website: Design System & Creative Direction (v1)

## Context

The backend for `002-core-cms` is mature (auth, media, projects, clients, services — all CMS-driven). The frontend is at zero (both apps are one-line scaffolds; Tailwind configured but never loaded). We are **designing the public website first**, as a **Figma** deliverable, before any UI code.

**This first site is for a real client: 22 STUDIO — a Creative Video Studio.** The design MUST carry 22Studio's identity, per `docs/22studio_brand_guidelines-2 (2).pdf` (the source of truth for color, type, logo, voice). The platform stays reusable for future studios, but v1 = 22Studio.

Positioning (from the guidelines): *results-driven* creative video — "We help brands get more sales. We help creators get more clients. Through creative video — always." Services: **Editing · AI Visuals · Creative Direction** (dynamic; more may be added). Every page is CMS-driven (nothing hardcoded).

On approval: (a) save this to `docs/design/public-site-design-system.md`, (b) build it in Figma, (c) drive the eventual build from it.

---

## 0. Thesis — "The Cutting Room"

22Studio is a *video editing* studio, so the site speaks the craft of the edit: **raw → edited, before/after, the cut.** That is both authentic and on-brand — their own content pillars are *Client Work · Before & After · Process · Results · Education.* The interface behaves like an edit bay / screening room: cinematic full-bleed video, a precise metadata rail (rendered in brand type, not a mono gimmick), and transitions that behave like **cuts**. Boldness lives in the work and in one precise red signal; everything else is disciplined black-and-white.

**Signature element:** the **Before/After cut.** A recurring interaction where "raw" wipes to "edited" on scroll or drag — on the hero, in featured work, and as a dedicated section. It literally demonstrates the service (editing) instead of describing it, and it is unmistakably 22Studio. Supported by a thin metadata rail (`CLIENT · SERVICE · YEAR`) and hard cut transitions between views.

The site is **results-first**, not an art gallery: every cinematic moment is tied to a benefit (more sales, more clients, views, wins). Craft earns trust; the CTA converts it.

---

## 1. Brand personality
Creative, inspiring, direct, results-driven (per guidelines' Voice & Tone). Tone: leans casual-but-serious, simple over technical. Confident, benefit-led, never corporate. Traits: *bold, cinematic, precise, conversion-minded.*

## 2. Emotional experience (journey → feeling)
| Stage | Section | Feeling to engineer |
|---|---|---|
| Impress | Hero + Before/After | "This studio makes video that hits." |
| Show the work | Featured Projects · Showreel | "The edits are genuinely great." |
| Build trust | Client wall | "100+ brands trusted them." |
| Capabilities | Services (Editing/AI/Direction) | "They can do what I need." |
| Proof | Process · Results/Stats · Testimonials | "They drive real results." |
| Convert | Final CTA · Contact | "I want them on my project." |

## 3. Visual language — color (brand-mandated)
Dark-first, exactly the 22Studio system. **Red is the single signature accent — never substituted, never glowed/shadowed (logo rule).**
- **Studio Black `#111111`** — primary background
- **22 Red `#E8192C`** — CTAs, logo mark, highlights, key accents (used sparingly, high impact)
- **Pure White `#FFFFFF`** — headlines & body on dark
- Supporting: **Card Surface `#1A1A1A`** (elevated), **Muted Gray `#888780`** (body/secondary text on dark), **Light Gray `#F5F5F5`** (rare light sections, e.g. legal), **Border Gray `#CCCCCC`** / hairline white@10% (dividers)
- Usage rules (verbatim from guidelines): Red-on-Black = CTAs/logo/highlights · White-on-Black = headlines/body on dark · Black-on-White = body/UI on light · Gray-on-White = captions/metadata.
- **Color comes from the work.** Video thumbnails/stills bring their own color; the chrome stays black/white/red so the brand reads instantly. (No invented per-project accent — it would fight the disciplined red identity.)

## 4. Typography system (brand-mandated) + bilingual
- **Display — Montserrat, Bold 700** (Medium 500 for subheads): headlines, titles, poster text, logo wordmark. This carries the personality.
- **Body/UI — Open Sans, Regular 400**: paragraphs, captions, descriptions, UI text.
- **Arabic — Lyon Arabic Display** (Bold display / Regular body): Arabic headlines, captions, bilingual content. **RTL.** Pair with Montserrat for bilingual layouts.
- Both Latin faces are free Google Fonts → self-host via `next/font` (fits $0-hosting). Lyon Arabic is licensed — confirm license / substitute a licensed Arabic display at build.
- **Metadata rail / labels:** Montserrat Medium, uppercase, tracked (+8%) at the Label size — this replaces the earlier mono idea and stays on-brand.
- Type scale (brand tokens, fluid up for cinematic web): **Display 48→(clamp)~120** (cover/poster headlines) · **H1 32→48** (page/section titles) · **H2 22→28** · **Body 14→16** · **Label 11** (tags/metadata/UI). Tight leading on display (~1.0); generous space around headlines.

## 5. Bilingual EN / AR (first-class)
The brand ships an Arabic display face and RTL guidance → localization is a real requirement, and the schema already carries a `locale` field on content. Design for: language toggle in nav; full **RTL mirroring** of layout, nav, sliders, and the before/after direction; Montserrat/Open Sans (LTR) ↔ Lyon Arabic Display (RTL); CMS content per locale. Every layout in Figma gets an RTL note; the two key templates (Home, Project) get an AR/RTL frame.

## 6. Grid & layout philosophy
12-column, generous margins (outer ~6vw, gutter 32), 8px vertical rhythm, max ~1440 with full-bleed video breaking the grid. Cinematic framing (16:9 / 2.39:1) for hero and key media; narrow text columns (~60ch) against wide video. Asymmetric, editorial — metadata rails hang in the margins. Near-zero radius on media frames (cinematic); 8–12 only on controls.

## 7. Motion & interaction language — "Cut vs. Dissolve"
Motion mirrors editing. **Big moments = cuts** (fast, hard clip-wipes; the Before/After reveal; curtain page transitions). **Normal content = dissolves** (subtle fade + rise). Never both, never decorative.
- Easings: `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)`; `--ease-cut` `cubic-bezier(0.7,0,0.3,1)`. Durations 200 / 450 / 800.
- Custom cursor: ring → `▶ PLAY` over video, `→` over links; magnetic on CTAs.
- Page transitions: red-or-ink curtain wipe → cut to new page (SPA feel).
- Reveals: video via clip-wipe (the cut); text via masked line-rise; client wall = marquee; stats = count-up; process = scroll-scrub; Before/After = draggable/scroll wipe.
- **Reduced motion**: cuts → instant, marquee paused, count-up → final, before/after → static split. Nothing essential depends on motion.

## 8. Navigation & logo
- **Logo** (guidelines §Logo): red "22" square mark + `STUDIO` wordmark. On dark bg use the red/white primary; never recolor, distort, add effects, or place on busy backgrounds; maintain clear space = logo height.
- Minimal persistent bar: logo left; `EN/عر` toggle + `MENU` right → full-screen overlay index (Work / Services / Clients / About / Contact, showreel thumb, contacts, socials). Scroll condenses the bar. Breadcrumb only inside case studies.

## 9. Component philosophy + inventory
Small, content-first, each mapped to a CMS model. Kit: Logo/Nav · Overlay Menu · Cinemascope MediaFrame (video/still, play affordance) · **BeforeAfter (signature)** · ProjectTile (featured/index) · MarqueeLogos · ServiceRow (immersive hover) · ProcessStep · StatCounter · TestimonialCard (project-linked) · FAQItem · CTABanner (red) · MetadataRail · Filter/SortBar · Pagination ("load more") · CustomCursor · PageCurtain · Footer · LangToggle.

## 10. Homepage experience (a results-driven visual story)
Each block maps to a CMS `HomepageSection` (owner enable/disable/reorder/configure). **Bold = new section types to add (see §19).**
1. **Hero** — full-bleed showreel/loop; a benefit-led statement in Montserrat; red CTA; language toggle; scroll cue. Optional hero **Before/After**. `HERO`.
2. **Trusted Clients** — moving logo wall; hover → mini work preview → client page. `CLIENTS`.
3. **Featured Projects** — 3–5 large editorial tiles, hover motion preview. `PROJECTS`.
4. **Showreel** — full-width reel (Vimeo — they're at vimeo.com/real22studio), scroll-scrub, play → theatre. **`SHOWREEL`**.
5. **Before / After** — the signature: raw→edited wipe on real work. **`BEFORE_AFTER`**.
6. **Services** — immersive hover list (§12). `SERVICES`.
7. **Process** — Discover → Strategy → Production → Editing → Delivery, scroll-revealed. **`PROCESS`**.
8. **Results / Statistics** — Projects · Clients · Views · Countries · Years, count-up (results framing). `STATS`.
9. **Testimonials** — each tied to a real project + client + logo. `TESTIMONIALS`.
10. **FAQ** — quiet accordion. `FAQ`.
11. **Final CTA** — emotional, benefit-led close; red primary "Start your project", secondary "View work". `CTA`.
12. **Footer** — sitemap, socials (instagram/22studi, tiktok/@_22studio, vimeo/real22studio), email real22studio@gmail.com, phone +20 108 061 5075, language toggle.

```
HERO ─ full-bleed edited reel, cinematic
┌───────────────────────────────────────────┐
│ [22]STUDIO                    EN/عر  MENU   │
│                                            │
│   YOUR STORY DESERVES                      │  ← Montserrat Bold, huge
│   A VIDEO THAT HITS.                       │
│   creative video that turns briefs into    │  ← Open Sans, muted gray
│   content people can't scroll past.        │
│   [ START YOUR PROJECT ]     ◐ before/after │  ← red CTA · signature
└───────────────────────────────────────────┘
```

## 11. Projects (index)
Curated reel, not a card grid. Large alternating editorial rows (big video + minimal meta: title, client, year, services). Filter/sort by service/client/year (maps to list API filters); keyset "Load more". Hover = motion preview. Directive empty/loading states in brand voice.

## 12. Project detail (case study) — "Behance meets Apple, edited by 22"
Full-bleed cover video; immersive scroll; large media, minimal text. Only Title required — layout must look intentional with any subset of fields.
```
[ full-bleed cover video · title over media ]
  metadata rail: CLIENT · YEAR · SERVICES · ROLE   (Montserrat tracked)
  ── Overview (narrow column, large lead) ──
  ██ full-bleed still ██     ▶ video (cinemascope)
  Challenge → Solution → Results  (results emphasized)
  ⟷ Before / After (the signature, real footage)
  ▦ gallery (masonry → theatre/lightbox)
  ── Credits · Client card · Services chips ──
  → Related Projects → Next Project (cut transition)
```
Maps to Project fields: overview/description/challenge/solution/results, typed media (GALLERY/VIDEO/BEFORE_AFTER + order), client, services, related, SEO.

## 13. Services + Service detail
**Index:** immersive hover list (no icon cards) — Editing · AI Visuals · Creative Direction (dynamic). Hover fills the background with that service's reel + one-line benefit + live project count (`_count.projects`). **Detail:** benefit hero, what's included (sub-services if present), representative work, red CTA.

## 14. Clients + Client detail
**Wall:** moving logo marquee; hover previews that client's work. **Detail:** client hero (name/logo/industry/site) + the grid of work done for them (Project.clientId). Trust made concrete — "100+ brands trusted us."

## 15. About · Contact · Privacy · Terms · 404
- **About:** studio story (results-driven mission/vision from guidelines), team, capabilities, human note.
- **Contact:** benefit-led invitation + quiet labeled form (name/email/message) → `Message` (POST /api/contact); active-voice button ("Start your project" → "Message sent"); email/phone/socials alongside.
- **Privacy/Terms:** clean long-form (the rare light-surface page).
- **404:** on-brand "this cut doesn't exist" → cut back to Work.

## 16. Mobile experience
Not desktop shrunk. Keep cinematic feel; strip heavy motion (no custom cursor, tap-to-play, before/after becomes tap-to-toggle). Single-column editorial stacks, full-bleed video, thumb-reachable red CTAs, overlay menu. Performance-first. RTL parity on mobile.

## 17. Accessibility & performance
- **A11y:** WCAG AA — verify white-on-`#111111` and **red `#E8192C` on black** for text/CTA contrast (red-on-black passes for large/CTA; avoid red for small body); visible keyboard focus (red ring); full keyboard nav (menu, lightbox, before/after slider); `prefers-reduced-motion` honored; semantic landmarks + media `alt`; captioned video; labeled forms with directive errors; RTL correctness.
- **Perf:** Core Web Vitals as a gate. Vimeo/lazy video with poster frames, responsive R2 media, `next/font` self-hosting (no CLS), route code-split, graceful motion degradation, SSR/ISR + JSON-LD per project + sitemap.

## 18. Design tokens recommendation
Rewrite the preset (`packages/config/tailwind.preset.ts`) to the 22Studio system (currently sky-blue/Inter placeholders):
- **Color:** `ink #111111 · red #E8192C · white #FFFFFF · card #1A1A1A · muted #888780 · light #F5F5F5 · border #CCCCCC`.
- **Type:** `display: Montserrat · body: 'Open Sans' · arabic: 'Lyon Arabic Display'`. Fluid scale tokens from §4.
- **Space:** 8px base (4→160). **Radius:** 0 for media frames, 8–12 controls. **Motion:** `--ease-out-expo`, `--ease-cut`, 200/450/800.
- **Z:** cursor > curtain > nav/overlay > rail > content. Grain overlay optional/low, static under reduced-motion.

## 19. Creative-director improvements & challenges (recommend better ideas)
To keep "nothing hardcoded," propose a small backend follow-up spec:
1. **Extend `HomepageSection` enum** — add `SHOWREEL`, `BEFORE_AFTER`, `PROCESS` (current: HERO/SERVICES/PROJECTS/CLIENTS/STATS/TESTIMONIALS/FAQ/CTA). The signature + showreel must be CMS-managed.
2. **Bilingual EN/AR** — per-locale content on translatable fields (schema already has `locale`); Settings needs localized site name/tagline; nav language toggle. First-class, not a bolt-on.
3. **`Testimonial` → link `projectId` + `clientId`** — brand wants testimonials tied to real projects/results.
4. **Client detail fields** — `industry`, `description`, optional `cover`.
5. **Showreel/Vimeo** — `showreelUrl` on Settings; video via Vimeo/YouTube (matches infra decision), not R2 uploads.
6. **Editable Stats** — model as label/value entries (Views, Clients, Wins), not fixed fields — results messaging must stay editable.
7. **Settings contact block** — email, phone (+20…), Instagram/TikTok/Vimeo — drive footer/contact from CMS.
8. **Reject raw HTML** in section config (XSS) — enforce in the US5 zod schemas.
9. **Challenge:** keep *structured* sections (no raw drag-drop HTML) — matches the product principle and the brand's disciplined system.
Recommendations, not blockers: Figma shows it all now; the deltas become a scoped US5+/follow-up spec.

## 20. Why this is distinctive (not a generic dark theme)
The red/black/white palette is **not an AI default here — it is 22Studio's mandated brand identity**, and the design principle is that the brand's own words win. Distinctiveness comes from elsewhere: (a) the **Before/After "cut"** signature that *performs* the service instead of describing it; (b) **results-first** storytelling (benefit-led copy, wins/views) rather than art-gallery neutrality; (c) **bold Montserrat editorial scale** with red as a precise, rare signal (never glowed — per logo rules); (d) genuine **bilingual EN/AR + RTL**; (e) edit-craft motion (cut vs. dissolve). Boldness is spent on the Before/After system; everything else stays quiet and disciplined — executed to Awwwards fidelity.

---

## Execution plan (after approval)
1. **Persist** — save this doc to `docs/design/public-site-design-system.md`.
2. **Extract brand assets** — pull the 22 logo (red square + STUDIO wordmark) and exact hex/type from the PDF into the Figma Foundations page; confirm the Lyon Arabic license (or pick a licensed AR display substitute).
3. **Build in Figma** — via Figma MCP; invoke `/figma-use` (mandatory) and `/figma-generate-design`. File **"22 STUDIO — Public Site"**, pages:
   `00 Cover · 01 Foundations (brand tokens: color/type/logo/motion) · 02 Components · 03 Home · 04 Projects · 05 Project Detail · 06 Services (+detail) · 07 Clients (+detail) · 08 About · 09 Contact · 10 System (404/loading/empty)`.
   Order: Foundations → Components → Home (hero + Before/After first) → Project Detail → rest. Desktop (1440), then mobile (390) for Home/Projects/Project Detail, **plus AR/RTL frames** for Home + Project Detail.
4. **Review loop** — after each page, `get_screenshot` and critique vs. this doc + the PDF (brand color/type/logo fidelity, red used sparingly, contrast, every block traceable to a CMS model or the §19 delta list); iterate.
5. **Downstream build (separate, later)** — set the tokens in the Tailwind preset, self-host Montserrat/Open Sans + Arabic via `next/font`, grow `packages/ui`, implement `apps/web` against the live APIs with EN/AR + RTL.

## Verification
- Done when Figma has all pages at desktop fidelity (+ mobile for the 3 key pages, + AR/RTL for Home & Project Detail), a Foundations page matching the PDF exactly (Studio Black/22 Red/White, Montserrat/Open Sans/Lyon Arabic, logo rules), and a Components page — each reviewed via screenshot against this doc and the brand PDF.
- Cross-check: every homepage block/page maps to a CMS model **or** appears in the §19 backend-delta list (nothing silently hardcoded).
- Brand fidelity: red appears only where the guidelines permit (CTAs/logo/highlights); white-on-#111111 and red-CTA-on-black meet AA; logo do's/don'ts respected; copy follows the "say this, not that" voice.
