# StudioFlow — Technical Architecture

> Phase 0 · Product Discovery
> The technical blueprint the phased [`implementation-plan.md`](./implementation-plan.md) builds
> against. Every decision traces to `.specify/memory/constitution.md` (v1.0.0). Companion:
> [`domain-model.md`](./domain-model.md).
>
> **Cost posture (v1):** this architecture is designed to run on **free hosting tiers** — target
> **$0/month plus ~$10/year for a custom domain**, no monthly subscription. See
> [§9 Deployment](#9-deployment-topology) and the deviation note in [§3](#3-backend--data-access-nextjs).

---

## 1. System overview

**Two** deployable Next.js apps over one shared domain and one database, with external media
storage. The backend lives **inside** the Next.js apps (route handlers + server actions) — there
is no separate always-on API server. This is the key to staying free and fast: the public site is
statically generated / CDN-cached (never sleeps), and server work runs as on-demand serverless
functions.

```text
                        ┌─────────────────────────────────────────────┐
        Visitors ─────► │  apps/web    (Next.js 15, App Router)        │  public portfolio
                        │  SSG/ISR · CDN-cached · always fast          │  (read-only, published content)
                        └───────────────┬─────────────────────────────┘
                                        │ server-side data access (build/ISR)
   Owner (single studio) ─►┌────────────▼─────────────────────────────┐
                           │  apps/admin (Next.js 15, App Router)      │  CMS (auth-gated)
                           │  UI + backend: route handlers / server    │  + RBAC + validation
                           │  actions → Service → Repository           │
                           └───────┬───────────────────────┬──────────┘
                                   │ Prisma                 │ SDK
                           ┌───────▼────────┐        ┌──────▼───────────┐
                           │  PostgreSQL    │        │ Cloudflare R2    │  media (free egress)
                           │ (Supabase free)│        │  (free tier)     │
                           └────────────────┘        └──────────────────┘

     Shared across both apps:  packages/{db, types, validation, ui, shared, config}
```

**Boundaries (Constitution VIII, XVII):**

- Database access (Prisma) is **server-side only** — it lives in `packages/db` and is imported only
  by server code (route handlers, server actions, server components). It is never bundled into the
  browser, and secrets stay in env.
- All **writes** happen in `apps/admin` behind authentication + RBAC. `apps/web` is read-only and
  renders **published** content only.
- Cross-app contracts live in `packages/types` and `packages/validation` so a schema change breaks
  the build, not production.

**Deviation from Constitution VIII (documented, justified):** the constitution's stricter reading —
"`web` and `admin` never touch the DB directly; all data flows through a separate `api`" — is
relaxed for this **single-studio, free-hosting** v1. A separate always-on API server is the single
hardest piece to keep free (free tiers sleep it, adding 30–50s cold starts). Folding the backend
into Next.js keeps the same layered discipline (Controller/handler → Service → Repository) while
removing the paid/always-on server. The layering is kept deliberately so a separate `apps/api` can
be **reintroduced without a rewrite** if/when multi-tenant SaaS is pursued (VII, XVI).

---

## 2. Monorepo topology

- **Tooling:** pnpm workspaces + Turborepo (task graph, remote-cacheable `build`/`lint`/`test`).
- **Apps** consume packages via workspace protocol (`workspace:*`); no cross-app imports — apps
  only depend on `packages/*`, never on each other.
- **`packages/config`** centralises `tsconfig`, ESLint, Prettier, and Tailwind presets so all
  surfaces share one standard (XVIII).
- **`packages/db`** owns the Prisma client + schema and is the single server-side data-access entry
  point shared by both apps.

```text
apps/web ──┐
apps/admin ├─► packages/db ─► packages/types ─► packages/validation ─► packages/shared
           │                      ▲
packages/ui ──────────────────────┘ (web + admin only)
```

---

## 3. Backend & data access (Next.js)

The backend is **inside the Next.js apps**, not a separate service. Writes and privileged reads run
in `apps/admin`; the public `apps/web` performs read-only, server-side data access at build/ISR
time. Every operation keeps the same vertical slice (Constitution VIII, XVIII):

```text
Request ─► Route Handler / Server Action ─► Service ─► Repository ─► Prisma ─► Postgres
             │ DTO + Validation (zod)         │ business   │ data-access
             │ (shared from packages/         │ rules      │ (thin, mockable)
             │  validation — never trusts     ▼            ▼
             │  client input, XVII)      RBAC policy   Entity/type mapping
             │                           check         └─► typed result (packages/types)
             ▼
        Consistent error envelope + structured logging
```

- **Route handler / server action** — routing + DTO binding; opens the RBAC policy check. No
  business logic.
- **Service** — business rules, orchestrates repositories, enforces status lifecycle.
- **Repository** — the only layer that talks to Prisma (in `packages/db`); keeps services testable
  via mocks.
- **Validation** — zod schemas shared from `packages/validation`; the backend **never trusts
  frontend validation** (XVII).
- **Policy** — RBAC resolves `User.role → permissions` and enforces least privilege.
- **Cross-cutting:** shared validation wrapper, consistent error envelope, structured logging with
  request IDs.

**Content Engine** is a shared base module (service mixin + Prisma model composition) giving every
content type: status transitions, slug generation, SEO embed, `featured`, audit
(`createdBy`/`updatedBy`), `publishedAt`, and a reserved `version` — so new content types are cheap
to add (XVI). See [`domain-model.md`](./domain-model.md).

---

## 4. Data layer (PostgreSQL + Prisma)

- **Prisma schema** is source of truth; **migrations are committed** and run in CI + deploy.
- **Hosting:** **Supabase Postgres** (free tier). The app/runtime connects via the **pooled**
  connection (PgBouncer, port 6543, `connection_limit=1`) so serverless functions don't exhaust
  connections; **Prisma migrations use a DIRECT connection** (`directUrl`, port 5432) because the
  pooler can't run DDL.
- Relational model fits the domain (Client → Project ↔ Service ↔ Media). Many-to-many via explicit
  join tables (`ProjectMedia` with a `type` column for gallery/video/before-after; `ProjectService`).
- **Indexing:** `slug` (unique per type), `status`, `publishedAt`, `featured`, and FK columns —
  sized for the ~20k-project scale target (IX).
- **Scale strategy:** cursor/keyset pagination on all list endpoints; no unbounded queries.
- **Multi-tenancy readiness (VII):** an additive `studioId` + query scope can be introduced later
  without redesign; v1 ships single-tenant with no `studioId`.

---

## 5. Authentication & authorization

```text
Login (admin) ──► /auth/login (route handler) ──► verify hash ──► issue:
                                        • access JWT   (short-lived, in memory)
                                        • refresh token(long-lived, httpOnly secure cookie)
Request ──► access JWT / session ──► auth check ──► RBAC policy ──► handler
Expiry  ──► /auth/refresh (cookie) ──► rotate refresh + new access JWT
Logout  ──► invalidate refresh (server-side store / rotation)
```

- **Scope (v1):** a single studio owner (+ optional employees). Auth guards `apps/admin`; the public
  `apps/web` is unauthenticated and read-only against published content.
- **RBAC:** `Role` → permission set; policy checks required permission per action; deny by default
  (least privilege, XVII).
- **Secrets:** all keys via env, never in the repo (see `.gitignore`); password hashing with
  argon2/bcrypt.

---

## 6. Media pipeline (Cloudflare R2 — Constitution V, X)

```text
admin upload ─► server (validate: type, size, mime) ─► Cloudflare R2 (S3-compatible store)
             ─► persist Media row (url, type, dims, alt, folder, tags, usageCount)
Projects/others ─► REFERENCE Media by id (never re-upload)
web/admin render ─► R2 public URL + Cloudflare image transforms (responsive, modern formats, lazy)
video ─► YouTube/Vimeo embeds (offload heavy video; keeps storage/egress near-$0)
delete ─► blocked while usageCount > 0 (delete-protection)
```

Media is a first-class, reusable asset in a central library — never owned by a single entity.
**Cloudflare R2's free tier** (10 GB storage, **zero egress fees**) covers v1; images are delivered
via R2 + Cloudflare on-the-fly transforms (responsive, modern-format, lazy), and heavy video is
offloaded to YouTube/Vimeo embeds. R2 is S3-compatible, so the storage layer stays portable.

---

## 7. Public rendering & performance (`apps/web`)

- **Rendering:** **SSG/ISR** for content pages, static where possible. Published content is
  pre-rendered and CDN-cached, so visitors get an instant page **even when the database or admin app
  is idle** — this is how the site stays *free and fast at the same time*.
- **Performance budget (X):** route-level code splitting, lazy media, Cloudflare-optimised images,
  minimal client JS, cursor pagination — enforced as Lighthouse/CWV CI gates in Phase 5.
- **Caching layers:** CDN/edge for pages + assets; incremental revalidation triggered on content
  publish; no dependency on an always-warm backend for public reads.

---

## 8. SEO, search, and accessibility

- **SEO (XI):** every content type embeds SEO metadata; `web` emits title/meta/canonical/OG/Twitter
  + JSON-LD structured data per page; sitemap + robots generated from published content.
- **Global search (XV):** a search module queries across Projects, Clients, Services, Media,
  Messages, Team. v1 uses Postgres full-text search (`tsvector` + GIN indexes); the interface is
  abstracted so it can move to a dedicated engine later without changing callers.
- **Accessibility (XII):** semantic HTML, keyboard nav, focus states, reduced-motion, alt text,
  WCAG AA contrast — audited via axe as a Phase 5 CI gate.

---

## 9. Deployment topology

Target: **$0/month + ~$10/year domain.** No separate always-on server to pay for.

```text
apps/web   ─► Vercel free (Hobby) — SSG/ISR, CDN, free SSL, custom domain   \
apps/admin ─► Vercel free (Hobby) — separate project, auth-gated             } $0/month
Postgres   ─► Supabase free tier (pooled 6543 for app; direct 5432 for migrations)
Cloudflare R2 ─► media storage (free egress) + Cloudflare image transforms; video via YouTube/Vimeo
Domain     ─► registrar (Cloudflare/Namecheap) ~$10–12/year — the only spend
CI/CD      ─► GitHub Actions: install → typecheck → lint → build → test → migrate → deploy
```

- **Custom domain on the free plan:** Vercel Hobby supports a custom domain + automatic free SSL at
  no charge — you only pay the registrar for the domain itself. Add it under Project → Settings →
  Domains and point DNS.
- **Free-tier caveat:** Vercel Hobby is officially **personal/non-commercial**. This v1 is a single
  owner's own studio portfolio. If usage becomes clearly commercial, the drop-in free alternative
  that explicitly allows commercial use is **Cloudflare Pages** (also free custom domain + SSL).
- **Serverless-friendly:** because the backend is Next.js route handlers/server actions (not a
  long-running container), it deploys as serverless functions — no host to keep warm, no sleep
  penalty on the public site.

Separate deploys per app mean a CMS change never risks the public site and vice-versa. A separate
`apps/api` and dedicated container host can be reintroduced later for SaaS scale (VII, XVI).

---

## 10. Observability & security posture

- **Logging:** structured JSON logs with request IDs; error tracking (e.g. Sentry free tier) across
  both apps.
- **Monitoring (Phase 5):** uptime + CWV RUM on `web`; error/latency dashboards.
- **Security (XVII):** validate all input server-side; signed/validated uploads; least-privilege
  RBAC; secrets only via env; rate-limiting + CORS/allowlist on write routes; never expose secrets
  or the DB client to the browser.

---

## 11. Technology decisions at a glance

| Concern | Choice | Why (constitution) |
|---|---|---|
| Repo | pnpm + Turborepo monorepo | VIII, XVI |
| Public + CMS | two separate Next.js 15 apps | II, VIII |
| Backend | Next.js route handlers / server actions (layered, RBAC, zod) | VIII, XVII, XVIII, free-hosting |
| DB | PostgreSQL + Prisma (Supabase free) | IX relational |
| Media | Cloudflare R2 (free egress) + YouTube/Vimeo for video | V, X |
| Auth | JWT + refresh + RBAC | XVII |
| Search | Postgres FTS (abstracted) | XV, XVIII |
| Rendering | SSG/ISR + edge cache | X, free-hosting |
| UI | Tailwind + shadcn/ui + Framer Motion | XIII |
| Hosting | Vercel free (Hobby) / Cloudflare Pages; Supabase; Cloudflare R2 | free-hosting, XVIII |
| CI/CD | GitHub Actions + per-app deploy | VIII, XVI |

> **Reintroducing a separate API (future SaaS):** the layered backend (handler → service →
> repository, with data access isolated in `packages/db`) is kept precisely so extracting a
> standalone `apps/api` (e.g. NestJS) later is additive, not a rewrite (VII, XVI).
