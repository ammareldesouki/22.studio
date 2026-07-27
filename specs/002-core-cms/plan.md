# Implementation Plan: Core CMS

**Branch**: `002-core-cms` | **Date**: 2026-07-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-core-cms/spec.md`

## Summary

Build the **CMS backend** for StudioFlow (Phase 2): secure custom-RBAC auth, a reusable Media
Library on Cloudflare R2, and the core content types (Clients, Services, Projects), plus Homepage
composition and global Settings — all sharing one **Content Engine** base (status/slug/SEO/featured/
audit/version). **Backend/API only** — no admin UI this phase (deferred until the theme/design is
planned); every capability is delivered as a Next.js route handler in `apps/admin` and verified by
automated tests. Domain logic lives in a new shared **`packages/core`** so modules stay isolated and
a standalone API can be extracted later without a rewrite.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node.js 20

**Primary Dependencies**: Next.js 15 route handlers / server actions (`apps/admin`); Prisma 6 +
PostgreSQL (Supabase); zod (`packages/validation`); `@aws-sdk/client-s3` (Cloudflare R2, S3 API);
bcryptjs (password hashing); `jose` (JWT sign/verify); Vitest

**Storage**: Supabase Postgres via Prisma. All content models extend the Content Engine base;
migrations add the full domain schema. Media binaries live in Cloudflare R2 (referenced by URL/key).

**Testing**: Vitest — unit (services + repositories, mocked), integration (route handlers against a
throwaway/test Postgres), RBAC **policy tests** (deny-by-default), validation tests (reject malformed
+ unauthorized). DB-touching tests skip when `DATABASE_URL` is unset (per Phase 1 pattern).

**Target Platform**: Serverless backend (Vercel route handlers) + Supabase Postgres + Cloudflare R2

**Project Type**: Web-app monorepo — backend only this phase (no UI)

**Performance Goals**: Correct + validated + paginated. Cursor/keyset pagination on all list
endpoints; login → published project in <10 min (SC-001). CWV/scale hardening deferred to Phase 5.

**Constraints**: No admin UI (backend/API only); **optimistic concurrency** via `version` (reject
stale writes); **deny-by-default** custom-RBAC on every action; media **delete-protection** +
referenced Client/Service **archive-not-delete**; slug **auto-suffix**; no secrets in source; each
module isolated (Constitution VIII).

**Scale/Scope**: 9 backend modules + Content Engine base; single-tenant, single-locale v1; ~1,000
items/list responsive now (SC-008), ~20k scale hardening in Phase 5.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate for the CMS backend | Status |
|---|---|---|
| I Content First / II CMS First / III Config over Hardcoding | This IS the CMS backend; all content editable via API, nothing hardcoded, no redeploy | ✅ PASS |
| IV Structured Flexibility | HomepageSection from a fixed catalog; no raw HTML (FR-019) | ✅ PASS |
| V Rich Media First | Central Media Library on R2; referenced by id, never owned (FR-008–012) | ✅ PASS |
| VI Projects are Case Studies | Project model, title-only-required, rich optional sections (FR-016) | ✅ PASS |
| VII Reusable Architecture | Single-tenant, additive `studioId` later; domain in extractable `packages/core` | ✅ PASS |
| VIII Modular Design | Per-module services/repositories in `packages/core`; explicit contracts; no cross-module coupling (FR-024) | ✅ PASS |
| IX Scalability | Keyset pagination + indexes now; heavy scale → Phase 5 | ✅ PASS |
| X Performance First | Backend correctness now; CWV/caching → Phase 3/5 | ✅ N/A this phase |
| XI SEO First | SEO metadata embedded on every content type (Content Engine); rendering → Phase 3 | ✅ PASS (data) |
| XII Accessibility / XIII UX / XIV Dashboard | **No UI this phase** — deferred to the frontend feature after theme planning | ✅ N/A (deferred) |
| XV Search Everywhere | Deferred → Phase 4 | ✅ N/A this phase |
| XVI Extensibility | Content Engine base makes new content types cheap; modular core | ✅ PASS |
| XVII Security | Custom RBAC deny-by-default, hashed passwords (bcrypt), server-side validation, signed R2 uploads, no secrets, rate-limited auth | ✅ PASS |
| XVIII Simplicity | Custom-RBAC builder adds complexity (user-chosen, see Complexity Tracking); everything else kept minimal | ⚠️ see Complexity Tracking |

**Gate result**: PASS. Two justified items in Complexity Tracking (custom RBAC; backend-in-Next.js
carried from Phase 1). No unjustified violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-core-cms/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions & rationale
├── data-model.md        # Phase 1 — entities, fields, relations, state, validation
├── quickstart.md        # Phase 1 — runnable validation guide (API + tests)
├── contracts/           # Phase 1 — API contracts per module
│   ├── auth.md
│   ├── users-roles.md
│   ├── media.md
│   ├── clients-services.md
│   ├── projects.md
│   └── homepage-settings.md
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks (NOT created here)
```

### Source Code (repository root)

```text
packages/
├── db/                         # Prisma schema (all domain models) + migrations + client
│   └── prisma/schema.prisma    # Content Engine base + User/Role/Media/Client/Service/Project/…
├── core/                       # NEW — domain modules (server-side only), extractable later
│   ├── content-engine/         # shared base: status, slug (+auto-suffix), seo, audit, version
│   ├── auth/                   # login/refresh/logout, password hashing, sessions
│   ├── rbac/                   # permission catalog + policy check (deny-by-default)
│   ├── users/  roles/          # user + role management (services + repositories)
│   ├── media/                  # R2 upload, folders, tags, usage-count, delete-protection
│   ├── clients/  services/     # catalog + ordering + archive-not-delete
│   ├── projects/               # case-study CRUD, media/client/service refs, lifecycle
│   ├── homepage/  settings/    # section composition; singleton settings
│   └── shared/                 # optimistic-concurrency helper, pagination, errors
├── validation/                 # zod schemas per entity + withValidation (from Phase 1)
├── types/                      # shared types + the permission catalog constant
apps/admin/
├── app/api/                    # thin route handlers per module → call packages/core
│   ├── auth/{login,refresh,logout}/route.ts
│   ├── users/  roles/  media/  clients/  services/  projects/  homepage/  settings/
│   └── health/route.ts         # (from Phase 1)
├── lib/                        # session/cookie helpers, rbac guard wiring, r2 client (from Phase 1)
└── __tests__/                  # route-handler integration tests
```

**Structure Decision**: Domain logic goes in a new **`packages/core`** (server-side only), with
**thin route handlers** in `apps/admin/app/api/*` doing auth+RBAC+validation and delegating to core
services. Prisma models + migrations live in `packages/db`; zod schemas in `packages/validation`; the
permission catalog + shared types in `packages/types`. This keeps modules isolated (VIII), lets the
future public `web` import read-side services directly, and makes extracting a standalone `apps/api`
additive (VII, XVI). Matches `docs/technical-architecture.md` §3.

## Complexity Tracking

| Violation / added complexity | Why needed | Simpler alternative rejected because |
|---|---|---|
| **Custom RBAC role builder** (vs fixed roles) | User decision (clarify Q1): admins create roles + assign granular permissions | Fixed roles (Owner/Editor) were simpler but the user requires custom roles; mitigated by a **fixed permission catalog** (no free-form strings) so it stays bounded and testable |
| **`packages/core` domain package** | Module isolation (VIII) + future standalone-API extraction (VII, XVI); shared read-side for Phase 3 web | Putting services inside `apps/admin/lib` couples domain logic to one app and blocks reuse/extraction |
| **Backend folded into Next.js** (carried from Phase 1) | Free-hosting; documented reversible deviation from strict VIII | A separate always-on API is not free-tier friendly; layering preserved so extraction stays additive |
