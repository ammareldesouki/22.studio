# Implementation Plan: Foundation & Product Discovery

**Branch**: `001-foundation-discovery` | **Date**: 2026-07-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-foundation-discovery/spec.md`

## Summary

Deliver (a) a ratified, internally consistent set of Phase 0 discovery artifacts and (b) a
buildable, CI-verified Phase 1 workspace skeleton with **zero business logic**. The skeleton is a
pnpm + Turborepo monorepo with **two Next.js 15 apps** (`apps/web` public, `apps/admin` CMS — each
with its backend built in via route handlers / server actions, **no separate API server**) and six
shared packages (`db`, `types`, `validation`, `ui`, `shared`, `config`). PostgreSQL + Prisma provide
an **empty baseline migration** (no domain tables); the backend exposes a **liveness** health-check
route and a **global input-validation** layer from the outset; CI runs install → typecheck → lint →
build → test → migrate (against a throwaway DB). The design targets **free hosting** (Vercel Hobby /
Cloudflare Pages, Supabase Postgres, Cloudflare R2 — $0/month + ~$10/year domain).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20 LTS

**Primary Dependencies**: Next.js 15 (App Router, React 19); Prisma 6 (`@prisma/client`); zod (shared
validation); Tailwind CSS + shadcn/ui + Framer Motion (in `packages/ui`); Turborepo; pnpm 9

**Storage**: PostgreSQL 16 via Prisma on Supabase (pooled 6543 for app, direct 5432 for migrations). Baseline
migration is **empty** (migration history + DB prerequisites only; no domain tables — FR-014, FR-020)

**Testing**: Vitest (workspace unit tests) + a health-route integration test; `prisma migrate deploy`
against a throwaway Postgres in CI. (Playwright/e2e deferred to later phases.)

**Target Platform**: Serverless web — Vercel Hobby (Next.js SSG/ISR + route handlers) or Cloudflare
Pages; Supabase Postgres; Cloudflare R2 media (free egress)

**Project Type**: Web application (monorepo: two Next.js apps + shared packages; backend-in-Next.js)

**Performance Goals**: Foundation only — clone→green build/test in <15 min (SC-003); health route
returns HTTP 200. Public-site CWV/perf budgets deferred to Phase 5.

**Constraints**: Zero business logic (FR-020); no secrets in source (FR-013); shared config defined
once (FR-009); a broken shared contract must fail the build (FR-010, SC-007); $0/month hosting target

**Scale/Scope**: Skeleton now; architecture must scale to ~20k projects later (Constitution IX)
without redesign. This feature = 2 apps + 6 packages + baseline migration + CI + health/validation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluated against StudioFlow Constitution v1.0.0. Because Phase 1 is infrastructure-only, most
product principles are **satisfied structurally** (the foundation must not violate them) while their
feature behavior is deferred to later phases.

| Principle | Gate for this foundation | Status |
|---|---|---|
| I Content First / II CMS First / III Config over Hardcoding | No content/business logic introduced; nothing hardcoded that later must be CMS-driven | ✅ PASS (deferred behavior) |
| IV Structured Flexibility / VI Case Studies | Not built yet; domain model reserved for Phase 2 | ✅ N/A this phase |
| V Rich Media First | Cloudflare R2 config wired but no feature consumes it (FR-019) | ✅ PASS |
| VII Reusable Architecture | Single-tenant v1; no `studioId` baked in; additive later | ✅ PASS |
| VIII Modular Design / feature isolation | Package boundaries + layered backend (handler→service→repository); **but backend folded into Next.js instead of a separate API** | ⚠️ DEVIATION — see Complexity Tracking |
| IX Scalability | Prisma relational + pagination-ready; no design blocks 20k scale | ✅ PASS |
| X Performance First | Public app is SSG/ISR + CDN; no always-on server on the read path | ✅ PASS |
| XI SEO First | No public pages yet; SEO embedded in domain model for Phase 3 | ✅ N/A this phase |
| XII Accessibility / XIII UX | No visitor UI yet | ✅ N/A this phase |
| XIV Dashboard Experience | No CMS UI yet | ✅ N/A this phase |
| XV Search Everywhere | Deferred; Postgres FTS planned | ✅ N/A this phase |
| XVI Extensibility | Monorepo + package contracts + reversible API extraction | ✅ PASS |
| XVII Security | Global input-validation from outset (FR-018); secrets via env (FR-013); no DB client in browser | ✅ PASS |
| XVIII Simplicity | Two apps instead of three; free-tier stack; no premature SaaS machinery | ✅ PASS (reinforced) |

**Gate result**: PASS with one documented, justified deviation (Principle VIII) recorded in
Complexity Tracking. No unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-discovery/
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 output — decisions & rationale
├── data-model.md        # Phase 1 output — foundation entities (domain entities deferred)
├── quickstart.md        # Phase 1 output — runnable validation guide
├── contracts/           # Phase 1 output — health route + package-export contracts
│   ├── health.md
│   └── package-contracts.md
├── checklists/
│   └── requirements.md  # Spec quality checklist (already passing)
└── tasks.md             # /speckit-tasks output (NOT created here)
```

### Source Code (repository root)

```text
studioflow/
├── apps/
│   ├── web/                     # public portfolio (Next.js 15 App Router; SSG/ISR)
│   │   ├── app/                 # routes (default page only in Phase 1)
│   │   └── tests/
│   └── admin/                   # CMS + backend (Next.js 15 App Router)
│       ├── app/
│       │   └── api/health/      # liveness health-check route handler (FR-017)
│       ├── lib/                 # server-side backend wiring (validation wrapper, auth stubs)
│       └── tests/               # health-route test
├── packages/
│   ├── db/                      # Prisma client + schema + migrations (server-side only)
│   │   └── prisma/
│   │       ├── schema.prisma    # no domain models in Phase 1
│   │       └── migrations/      # empty baseline migration (FR-014)
│   ├── types/                   # shared TypeScript types
│   ├── validation/              # shared zod schemas + global-validation helper (FR-018)
│   ├── ui/                      # shared shadcn/ui components (minimal in Phase 1)
│   ├── shared/                  # shared utilities/constants
│   └── config/                  # eslint, prettier, tsconfig, tailwind presets (FR-009)
├── .github/workflows/ci.yml     # install→typecheck→lint→build→test→migrate (FR-011, FR-015)
├── docs/                        # Phase 0 discovery docs (ratified)
├── turbo.json                   # Turborepo task graph
├── pnpm-workspace.yaml
└── package.json                 # root scripts: build, test, typecheck, lint
```

**Structure Decision**: Web-application monorepo (backend-in-Next.js variant). Two deployable apps
(`apps/web`, `apps/admin`) depend only on `packages/*`, never on each other. `packages/db` is the
single server-side data-access entry point. The health route and validation layer live in
`apps/admin`'s backend (route handlers). This matches `docs/technical-architecture.md` §1–§3.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Backend folded into Next.js instead of a separate `apps/api` (deviation from strict Constitution VIII)** | A single-studio v1 must run on **free hosting**; a separate always-on API server is the one piece free tiers sleep (30–50s cold starts), breaking the "free AND fast" requirement. Next.js route handlers/server actions deploy as serverless functions with no warm-server cost. | A separate NestJS API (the original plan) was rejected **for now** because it forces a paid/always-on host and adds a second deploy target with no feature benefit in a single-tenant v1. The layered discipline (handler→service→repository, data access isolated in `packages/db`) is preserved so a standalone `apps/api` can be extracted later for SaaS **without a rewrite** (VII, XVI). Justified under Governance complexity-justification. |
