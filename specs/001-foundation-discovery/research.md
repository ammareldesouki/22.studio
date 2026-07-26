# Phase 0 Research: Foundation & Product Discovery

The architecture is locked by `docs/technical-architecture.md` and the spec's clarifications, so this
document records the **decisions** that turn those constraints into a buildable Phase 1 skeleton.
No open `NEEDS CLARIFICATION` items remain.

---

## 1. Backend location — Next.js vs separate API

- **Decision**: Build the backend **inside the Next.js apps** (route handlers + server actions);
  no separate `apps/api` server.
- **Rationale**: Free-hosting requirement (§spec Assumptions). A standalone always-on API is the
  only component free tiers sleep, adding cold-start latency and breaking "free AND fast". Serverless
  route handlers have no warm-server cost. Layering (handler→service→repository) is preserved so a
  future `apps/api` extraction is additive.
- **Alternatives considered**: Separate NestJS API (original plan) — rejected for v1: forces a
  paid/always-on host, second deploy target, no single-tenant benefit. Documented deviation from
  Constitution VIII (see plan Complexity Tracking).

## 2. Monorepo tooling

- **Decision**: pnpm 9 workspaces + Turborepo; six packages (`db`, `types`, `validation`, `ui`,
  `shared`, `config`).
- **Rationale**: Locked by architecture (§2). Turborepo gives cacheable `build`/`lint`/`test` task
  graph and affected-only builds; pnpm workspace protocol (`workspace:*`) wires shared packages.
- **Alternatives considered**: npm/yarn workspaces (weaker caching), Nx (heavier than needed — XVIII).

## 3. Shared config, single source (FR-009)

- **Decision**: `packages/config` exports base `tsconfig`, ESLint (flat config), Prettier, and
  Tailwind presets; every app/package extends them.
- **Rationale**: One standard reused everywhere; a change propagates once.
- **Alternatives considered**: Per-app duplicated config — rejected (drift, maintenance cost).

## 4. Cross-package type safety (FR-010, SC-007)

- **Decision**: Apps import shared types/zod schemas from `packages/types` + `packages/validation`;
  Turborepo `build` depends on package builds so a broken exported contract fails `typecheck`/`build`.
- **Rationale**: Proves a shared-contract break surfaces at build time, not runtime (SC-007).
- **Validation**: A deliberate breaking change to an exported type must fail CI (quickstart scenario).

## 5. Database & baseline migration (FR-013, FR-014)

- **Decision**: PostgreSQL 16 + Prisma 6, client/schema in `packages/db`. Baseline migration is
  **empty** — it establishes Prisma migration history and any DB-level prerequisites (e.g.
  extensions) but creates **no domain tables** (clarified; honors FR-020 zero business logic).
- **Rationale**: Proves migrations connect and apply cleanly (US3) without introducing content models
  (those are Phase 2). Connection uses externally supplied config (no secrets in source).
- **Hosting**: Supabase free tier. App uses the pooled connection (`DATABASE_URL`, 6543); Prisma
  migrations use the direct connection (`DIRECT_URL`, 5432) via `directUrl`.
- **Alternatives considered**: A placeholder/health table — rejected (would be business-logic-ish and
  removed in Phase 2). Migration-tracking-only without extensions — acceptable but the empty baseline
  leaves room for required extensions.

## 6. Health-check route (FR-017)

- **Decision**: A **liveness** route handler at `GET /api/health` in `apps/admin` returning HTTP 200
  `{ status: "ok" }`. It does **not** touch the database (clarified).
- **Rationale**: US4 is runtime viability; DB verification is covered independently by the CI
  migration check (FR-015). Keeps the probe stable and free of DB-availability flakiness.
- **Alternatives considered**: Deep readiness probe (DB check) — rejected per clarification.

## 7. Global input validation (FR-018)

- **Decision**: A shared validation helper in `packages/validation` (zod) wraps route
  handlers/server actions so every incoming request is parsed/validated before handler logic; invalid
  input yields a consistent error envelope.
- **Rationale**: Establishes "never trust unvalidated input" (Constitution XVII) from the outset,
  replacing NestJS's global `ValidationPipe` with a Next.js-native equivalent.
- **Alternatives considered**: Ad-hoc per-route validation — rejected (inconsistent, easy to forget).

## 8. Media wiring (FR-019)

- **Decision**: Initialize Cloudflare R2 config from env and assert config presence/validity;
  **no live network call** in CI (clarified). R2 free tier (10 GB storage, free egress); heavy
  video offloaded to YouTube/Vimeo embeds.
- **Rationale**: No feature consumes media in Phase 1; a live credential check would add a flaky
  external CI dependency for no payoff (XVIII).

## 9. Testing strategy

- **Decision**: Vitest as the workspace unit-test runner; one integration test hitting the health
  route; `prisma migrate deploy` exercised in CI against a throwaway Postgres. e2e (Playwright) and
  CWV/axe gates deferred to Phase 5.
- **Rationale**: Vitest is fast, TS-native, and monorepo-friendly; matches the zero-business-logic
  scope (few tests, all meaningful).
- **Alternatives considered**: Jest (slower TS setup), node:test (leaner but less monorepo ergonomics).

## 10. CI pipeline (FR-011, FR-012, FR-015)

- **Decision**: GitHub Actions single workflow: `install → typecheck → lint → build → test →
  migrate`. Postgres provided as a **service container**; migration runs against it (throwaway).
  Single aggregate pass/fail.
- **Rationale**: Reproduces a clean checkout (SC-003/SC-004); proves migrations in CI not just
  locally (FR-015). pnpm cache + Turborepo cache keep it fast.
- **Alternatives considered**: External hosted test DB — rejected (slower, credential burden; a
  service container is disposable and clearly attributable on failure — edge case in spec).

## 11. Hosting & deployment

- **Decision**: `apps/web` + `apps/admin` on **Vercel Hobby (free)** with SSG/ISR + free SSL + custom
  domain; Supabase free Postgres; Cloudflare R2 free. **Cloudflare Pages** documented as the commercial-safe
  free alternative.
- **Rationale**: Meets $0/month + ~$10/year-domain target. Vercel is smoothest for Next.js; Vercel
  Hobby is personal/non-commercial, so Cloudflare Pages is the fallback if usage becomes commercial.
- **Alternatives considered**: Paid Vercel Pro / container hosts — rejected for v1 cost target.

---

## Open risks (tracked, not blocking)

- **Vercel Hobby non-commercial terms** — if the single-studio site becomes clearly commercial,
  migrate `web`/`admin` to Cloudflare Pages (drop-in). Noted in architecture §9.
- **Serverless DB connections** — use the Supabase pooler / Prisma connection limits to avoid exhaustion on
  serverless functions. Revisit if list endpoints appear in Phase 2.
