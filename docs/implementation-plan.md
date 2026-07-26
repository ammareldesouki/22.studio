# StudioFlow — Implementation Plan

> Phase 0 · Product Discovery — master roadmap
> Phase-by-phase execution plan with an explicit **Testing Gate in every phase**. Every decision
> traces to `.specify/memory/constitution.md` (v1.0.0). Companion docs:
> [`product-vision.md`](./product-vision.md), [`personas.md`](./personas.md),
> [`user-flows.md`](./user-flows.md), [`domain-model.md`](./domain-model.md),
> [`technical-architecture.md`](./technical-architecture.md).

---

## How to read this plan

Each phase uses the same template:

```text
Goal           — one-line outcome
Depends on     — prerequisites
Tech Focus     — the technical-architecture areas this phase builds
Deliverables   — artifacts produced
Tasks          — ordered checklist
Testing Gate   — what must be tested + how (REQUIRED to exit the phase)
Exit Criteria  — objective, checkable done conditions
```

The **Tech Focus** of each phase points at the relevant sections of
[`technical-architecture.md`](./technical-architecture.md) — that document is the "how", this one
is the "when/prove-it".

A phase is not "done" until its **Testing Gate passes** and its **Exit Criteria** are met.

---

## Locked architecture decisions

| Area | Decision | Rationale (constitution) |
|---|---|---|
| Repo | Monorepo — pnpm workspaces + Turborepo | VIII, XVI shared code, independent deploys |
| Apps | `apps/web` (public, Next.js 15 App Router), `apps/admin` (CMS, Next.js 15) — backend built into the Next.js apps (route handlers / server actions); **no separate `apps/api` server** | II, VIII, free-hosting |
| Packages | `db`, `ui`, `shared`, `types`, `validation`, `config` | VIII, XVIII reuse without duplication |
| DB | PostgreSQL + Prisma (Supabase free tier) | relational domain (IX) |
| Storage | Cloudflare R2 (free egress) + YouTube/Vimeo for video | V rich media, optimisation (X) |
| Auth | JWT + refresh tokens + RBAC | XVII least privilege |
| Frontend | TypeScript, Tailwind, shadcn/ui, Framer Motion | XIII UX, XVIII simplicity |
| Hosting | Free tiers — Vercel Hobby / Cloudflare Pages; **$0/month + ~$10/year domain** | free-hosting, XVIII |
| Content | **Content Engine** base on every content type | I, III, XVI maintainable & extensible |

> **Deviation note:** folding the backend into Next.js (instead of a separate `apps/api` NestJS
> server) is a documented, reversible deviation from the strict reading of Constitution VIII,
> chosen so a single-studio v1 runs on free hosting. The layered discipline is preserved so a
> standalone API can be extracted later for SaaS. See `technical-architecture.md` §3.

### Folder structure

```text
studioflow/
├── apps/
│   ├── web/            # public portfolio (Next.js 15, App Router)
│   └── admin/          # CMS + backend (Next.js 15, App Router; route handlers / server actions)
├── packages/
│   ├── db/             # Prisma client + schema (server-side data access)
│   ├── ui/             # shared shadcn/ui components
│   ├── shared/         # shared utilities/constants
│   ├── types/          # shared TypeScript types
│   ├── validation/     # shared zod/DTO schemas
│   └── config/         # eslint, tsconfig, tailwind presets
├── docs/               # Phase 0 discovery docs (this folder)
├── specs/              # reserved (Spec Kit)
└── scripts/
```

### Backend philosophy (every module, inside Next.js)

```text
Route Handler / Server Action → Service → Repository → DTO → Entity → Validation → Policy → Tests
```

### Frontend philosophy (feature-first, not nested components)

```text
feature/
  components/
  hooks/
  api/
  types/
  utils/
```

### Database philosophy

Everything is content; all content types extend the Content Engine base (status, SEO, slug,
featured, audit, versioning-ready). See [`domain-model.md`](./domain-model.md).

---

## Phase 0 — Product Discovery

- **Goal:** Establish shared understanding, constitution, and domain before any code.
- **Depends on:** —
- **Tech Focus:** whole of `technical-architecture.md` (§1–§11) authored & agreed.
- **Deliverables:** `constitution.md` (done, v1.0.0) + `product-vision.md`, `personas.md`,
  `user-flows.md`, `domain-model.md`, `implementation-plan.md`.
- **Tasks:**
  1. Ratify constitution. ✅
  2. Write product vision, personas, user flows, domain model.
  3. Write this phased implementation plan with testing gates.
- **Testing Gate:** Review that every doc is internally consistent and maps to the constitution's
  18 principles; the domain model has no orphan entities; every constitution *Definition of
  Failure* has a mitigating decision (see mapping table below).
- **Exit Criteria:** All Phase 0 docs exist under `docs/` and pass review.

---

## Phase 1 — Foundation (infrastructure only, zero business logic)

- **Goal:** A buildable, testable monorepo skeleton with DB, auth scaffolding, and CI.
- **Depends on:** Phase 0.
- **Tech Focus:** §2 Monorepo topology, §3 Backend & data access, §4 Data layer, §9 Deployment/CI.
- **Deliverables:** `apps/web`, `apps/admin`, `packages/*` (incl. `db`), Prisma schema baseline,
  CI pipeline, env/R2 wiring, health-check route.
- **Tasks:**
  1. Init pnpm workspaces + Turborepo; shared `config` (eslint/prettier/tsconfig/tailwind).
  2. Scaffold two apps + six packages with shared types/validation wired in.
  3. Provision Postgres (free tier); Prisma init in `packages/db` + connection; baseline migration.
  4. Next.js backend bootstrap: env/config, health-check route handler, global validation wrapper.
  5. Next.js 15 bootstrap for web + admin (App Router, Tailwind, shadcn/ui).
  6. CI: install, typecheck, lint, build, test.
- **Testing Gate:** CI green — `typecheck`, `lint`, `build` pass for **all** apps/packages;
  `prisma migrate` runs against a throwaway test DB; `GET /api/health` returns 200; each app
  boots locally.
- **Exit Criteria:** `pnpm build` and `pnpm test` pass on a clean checkout in CI.

---

## Phase 2 — Core CMS

- **Goal:** A fully working CMS backend + admin UI for all core content.
- **Depends on:** Phase 1.
- **Tech Focus:** §3 backend layering + Content Engine, §5 Auth/RBAC, §6 Media pipeline, §4 Data layer.
- **Build order (Media before Projects — Projects reference Media, Constitution V):**
  `Auth → Users → Roles → Media → Clients → Services → Projects → Homepage → Settings`.
- **Deliverables:** Per module — Route Handler / Server Action → Service → Repository → DTO →
  Entity → Validation → Policy → Tests; Content Engine base applied to all content modules; admin
  screens for each.
- **Module highlights:**
  - **Media Library:** upload, folders, search, preview, collections, usage count, tags,
    delete-protection, AI-search-ready.
  - **Services:** Service → optional SubService → referenced by Projects.
  - **Clients:** Client → Projects.
  - **Projects (largest module):** sections General / Media / SEO / Related / Publishing;
    lifecycle Draft → Published → Archived; every field optional except title.
  - **Homepage Builder:** section-based (Hero, Services, Projects, Clients, Stats, Testimonials,
    FAQ, CTA); enable / disable / reorder / configure — never raw HTML.
  - **Settings:** site name, logo, social, SEO defaults, analytics, contact.
- **Testing Gate:** unit tests (service + repository) per module; API integration/contract tests
  per endpoint; **RBAC policy tests** proving least privilege (XVII); validation tests proving the
  API never trusts frontend input; admin **e2e** for the critical *upload media → create client/
  service → build project referencing media → publish* flow. A per-module coverage target is set
  and enforced in CI.
- **Exit Criteria:** Through the admin app, an editor can upload media, create a client and
  service, build a project that references library media, and publish it — all covered by passing
  automated tests.

---

## Phase 3 — Public Website

- **Goal:** The visitor-facing site, rendered entirely from CMS data.
- **Depends on:** Phase 2.
- **Tech Focus:** §7 Public rendering & performance, §8 SEO/accessibility, §6 Media delivery.
- **Pages:** Home, Projects, Project Details, Services, Clients, About, Contact.
- **Deliverables:** `apps/web` pages consuming the API; homepage assembled from configured
  sections; contact form that creates a `Message`; SEO tags + structured data per page; sitemap +
  robots.
- **Tasks:**
  1. Data layer to the API; typed via `packages/types`.
  2. Build each page; nothing hardcoded (Constitution I, III).
  3. Homepage renders enabled sections in configured order.
  4. Contact form → `POST` → creates Message.
  5. Per-page SEO metadata + JSON-LD; generate sitemap/robots.
- **Testing Gate:** rendering/e2e tests proving each page pulls from CMS (toggling a section or
  unpublishing a project changes the site); contact submission creates a Message; initial Core Web
  Vitals / Lighthouse budget check on Home + Project Details; SEO tags asserted present per page.
- **Exit Criteria:** Full public site is navigable end-to-end against CMS content and meets the CWV
  budget on key pages.

---

## Phase 4 — Advanced CMS

- **Goal:** Round out the CMS with operational and cross-cutting modules.
- **Depends on:** Phase 2 (and Phase 3 for Messages surfaced from public site).
- **Tech Focus:** §8 Global search (Postgres FTS), §3 new API modules, §10 Observability hooks.
- **Deliverables:** Analytics, Messages inbox, Team, Testimonials, **Global Search**; stubs for
  future Collections / Blog.
- **Testing Gate:** feature tests for the messages inbox (unread → read → handled), testimonials
  publishing lifecycle, and **global search** returning correct results across Projects, Clients,
  Services, Media, Messages, Team (Constitution XV).
- **Exit Criteria:** Global search returns correct cross-entity results; all advanced modules
  covered by passing tests.

---

## Phase 5 — Optimisation

- **Goal:** Make performance, SEO, and accessibility enforced budgets, not aspirations.
- **Depends on:** Phases 3–4.
- **Tech Focus:** §7 Caching/performance, §8 SEO/a11y, §10 Observability & security, §4 scale/indexing.
- **Deliverables:** SEO hardening, caching strategy, image/video optimisation, code splitting,
  a11y fixes, monitoring + logging.
- **Testing Gate:** automated **a11y audit (axe)** meeting **WCAG AA** (XII); **Lighthouse / CWV**
  thresholds enforced as CI gates (X); sitemap / robots / structured data validated (XI);
  load & pagination check at the scale target (~20k projects, IX).
- **Exit Criteria:** Performance, SEO, and accessibility budgets all pass as CI gates.

---

## Phase 6 — Future (roadmap only, not built in v1)

- **Goal:** Document the growth path so v1 architecture stays compatible.
- **Tech Focus:** §4 multi-tenancy readiness, §8 pluggable search engine, §9 SaaS/mobile deploy path.
- **Scope:** Quote Requests, Collections, Blog, Approval Workflow, Client Portal, Invoices, public
  API, Multi-studio (multi-tenant), Billing, White-label.
- **Testing Gate:** N/A (planning only). Constraint: each future module, when built, must ship with
  the **same per-module test discipline as Phase 2** and must not break existing features
  (Constitution XVI).
- **Exit Criteria:** Roadmap documented; no v1 decision blocks these additions (multi-tenancy is
  additive per [`domain-model.md`](./domain-model.md)).

---

## Timeline estimate

One experienced full-stack developer:

| Phase | Focus | Duration |
|---|---|---|
| 0 | Product Discovery & docs | ~1 week |
| 1 | Foundation & infrastructure | ~1 week |
| 2 | Core CMS | 3–4 weeks |
| 3 | Public Website | ~2 weeks |
| 4 | Advanced CMS + Polish / QA | ~1 week |
| 5 | Optimisation, Deployment & Docs | 3–5 days |

**Total: ~8–10 weeks to a polished v1.**

---

## Constitution *Definition of Failure* → mitigation map

| Failure mode | Mitigating decision(s) |
|---|---|
| Developers needed for simple content updates | Content Engine + full CMS (Phases 2, 4); nothing hardcoded (Phase 3) |
| Performance degrades as content grows | Phase 5 CWV/Lighthouse CI gates; pagination + scale test (IX) |
| Business logic tightly coupled | Layered backend (route handler → service → repository) per module (Phase 2) |
| Modules become mutually dependent | Modular monorepo + explicit interfaces via `packages/types` (VIII) |
| CMS becomes hard to use | Notion/Framer-grade admin UX, e2e flow tests (XIV, Phase 2) |
| Architecture prevents future evolution | Additive multi-tenancy; Phase 6 compatibility constraint (VII, XVI) |
| Design over usability | Testing gates prioritise flows; a11y AA gate (XII, XIII, Phase 5) |

Every one of the constitution's 18 principles is exercised by at least one phase above.
