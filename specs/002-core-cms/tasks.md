---
description: "Task list for Core CMS"
---

# Tasks: Core CMS

**Input**: Design documents from `/specs/002-core-cms/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included — the spec's acceptance scenarios plus SC-003 (RBAC) and SC-007 (validation)
explicitly require automated tests. Backend-only feature, so tests are the acceptance surface (no UI).

**Organization**: By user story. Domain logic lives in `packages/core` (services + repositories);
thin route handlers in `apps/admin/app/api/*`; Prisma models in `packages/db`; zod in
`packages/validation`; permission catalog in `packages/types`. **No admin UI this phase.**

## Format: `[ID] [P?] [Story] Description`
- **[P]**: different files, no dependency on incomplete tasks
- **[Story]**: US1–US6
- All backend code is server-side only; DB-touching tests skip when `DATABASE_URL` is unset.

---

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Scaffold `packages/core` (package.json, tsconfig extending config, `src/index.ts`, module subdirs: `content-engine/ auth/ rbac/ users/ roles/ media/ clients/ services/ projects/ homepage/ settings/ shared/`) with `test`/`typecheck`/`lint` scripts + vitest.config
- [X] T002 [P] Add backend deps: `bcryptjs`, `jose` to `packages/core`; `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` to `packages/core` (R2)
- [X] T003 [P] Define the fixed **permission catalog** constant + `Permission` type in `packages/types/src/permissions.ts` (projects:create|edit|publish|delete, media:upload|delete, clients:manage, services:manage, homepage:manage, users:manage, roles:manage, settings:manage)
- [X] T004 [P] Add shared zod base helpers in `packages/validation/src/` (pagination cursor, id, SEO object, `withValidation` already exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: Blocks all user stories.

- [X] T005 Extend `packages/db/prisma/schema.prisma` with all models + enums + indexes per data-model.md: Content Engine base fields on content types; `User, Role, Media, Folder, Client, Service, SubService, Project, HomepageSection, Testimonial, Page, Settings`; join tables `ProjectService, ProjectMedia (typed), RelatedProject`; unique indexes (slug per type, email, role name) + FKs
- [X] T006 Generate + apply the migration (`pnpm --filter @studioflow/db migrate`) against Supabase; verify with `migrate:verify`
- [X] T007 Implement `content-engine` in `packages/core/src/content-engine/` — status transitions (draft/publish/unpublish/archive/restore + publishedAt), slug generation + collision auto-suffix, and the **optimistic-concurrency** update helper (WHERE id+version, bump version, 0-row → Conflict)
- [X] T008 [P] Shared helpers in `packages/core/src/shared/` — keyset pagination, typed error envelope (Conflict/Forbidden/Validation/NotFound), transactional usage-count adjuster
- [X] T009 [P] RBAC policy in `packages/core/src/rbac/` — `requirePermission(user, permission)` deny-by-default, reading the catalog from `@studioflow/types`
- [X] T010 Auth/session middleware in `apps/admin/lib/` — verify access JWT (`jose`), load user+role, expose `getSession` + `requirePermission` guard for route handlers
- [X] T011 Seed script in `packages/db` — create the immutable owner role (all permissions) + a bootstrap owner user (hashed password)

**Checkpoint**: schema live, Content Engine + RBAC + session guard ready — stories can proceed.

---

## Phase 3: User Story 1 - Secure admin access with roles (Priority: P1) 🎯 MVP

**Goal**: Login/refresh/logout, user management, custom roles + permission enforcement.

**Independent Test**: Create a role + user, log in, confirm permitted actions succeed and
non-permitted are denied (deny-by-default).

- [X] T012 [P] [US1] Auth service in `packages/core/src/auth/` — login (bcrypt verify), issue access JWT + refresh, refresh rotation + revocation store, logout
- [X] T013 [P] [US1] Users service + repository in `packages/core/src/users/` (CRUD, email-unique, set-password, last-owner guard)
- [X] T014 [P] [US1] Roles service + repository in `packages/core/src/roles/` (CRUD, permissions ⊆ catalog, immutable owner role, block delete while assigned)
- [X] T015 [US1] Auth route handlers in `apps/admin/app/api/auth/{login,refresh,logout}/route.ts` (cookies per contracts/auth.md; rate-limit login)
- [X] T016 [US1] Users route handlers in `apps/admin/app/api/users/` (+ `[id]/password`) with `users:manage` guard + validation
- [X] T017 [US1] Roles route handlers in `apps/admin/app/api/roles/` + `GET /api/permissions` with `roles:manage` guard
- [X] T018 [P] [US1] zod schemas for auth/users/roles in `packages/validation/src/`
- [X] T019 [US1] Tests in `packages/core` + `apps/admin/__tests__/` — auth flow, **RBAC policy tests (each permission allowed vs denied, SC-003)**, unauthorized → 401/403

**Checkpoint**: Access control works; every later route can be gated + tested.

---

## Phase 4: User Story 2 - Central Media Library (Priority: P1) 🎯 MVP

**Goal**: Upload once to R2, organize, reuse by id, usage counts, delete-protection.

**Independent Test**: Upload, reference from two entities (seeded), confirm usageCount=2 and
delete blocked; invalid upload rejected.

- [X] T020 [P] [US2] Media + Folder service/repository in `packages/core/src/media/` — presigned upload-intent (validate type/size), confirm/finalize, folders, tags, usage-count, delete-protection
- [X] T021 [US2] Media route handlers in `apps/admin/app/api/media/` (upload-intent, `[id]/confirm`, list/filter, patch, delete) + `apps/admin/app/api/folders/` per contracts/media.md, guarded by `media:upload`/`media:delete`
- [X] T022 [P] [US2] zod schemas for media/folders (image ≤10MB `jpeg,png,webp,avif,svg`; video ≤100MB `mp4,webm`) in `packages/validation/src/`
- [X] T023 [US2] Tests — reuse → usageCount, delete-protection **409** (SC-004), invalid upload **422**, presigned-intent shape

**Checkpoint**: Media reusable + protected.

---

## Phase 5: User Story 3 - Projects as case studies (Priority: P1) 🎯 MVP

**Goal**: Rich Project CRUD referencing media/clients/services, publish lifecycle, title-only-required.

**Independent Test**: Create title-only Draft → enrich with refs/sections → publish/archive;
duplicate title auto-suffixes slug; concurrent edit → 409.

- [X] T024 [P] [US3] Projects service/repository in `packages/core/src/projects/` — CRUD, `ProjectMedia`(typed)/`ProjectService`/`RelatedProject` refs with transactional usageCount, lifecycle + SEO, optimistic concurrency
- [X] T025 [US3] Projects route handlers in `apps/admin/app/api/projects/` (+ `[id]/status`) guarded by `projects:create|edit|publish|delete` per contracts/projects.md
- [X] T026 [P] [US3] zod schemas for projects (title required, all else optional) in `packages/validation/src/`
- [X] T027 [US3] Tests — title-only Draft, media/client/service refs, publish stamps `publishedAt`, archive/restore, **slug auto-suffix**, **optimistic-concurrency 409** (FR-025)

**Checkpoint**: Core content type complete.

---

## Phase 6: User Story 4 - Clients & Services catalog (Priority: P2)

**Goal**: Clients + Services (+ sub-services), ordering, referenced by projects, archive-not-delete.

**Independent Test**: Create/reorder clients & services, reference from a project; hard-delete a
referenced one → blocked, archive works.

- [X] T028 [P] [US4] Clients service/repository in `packages/core/src/clients/` (CRUD, order, archive-not-delete when referenced)
- [X] T029 [P] [US4] Services + SubServices service/repository in `packages/core/src/services/`
- [X] T030 [US4] Clients + Services route handlers in `apps/admin/app/api/clients/` and `.../services/` (+ reorder, + status, + subservices) per contracts/clients-services.md
- [X] T031 [P] [US4] zod schemas for clients/services in `packages/validation/src/`
- [X] T032 [US4] Tests — create/reorder, reference from project, **hard-delete-while-referenced 409** + archive succeeds

**Checkpoint**: Projects can be fully attributed.

---

## Phase 7: User Story 5 - Compose the homepage (Priority: P2)

**Goal**: Section-based homepage composition; no raw HTML.

**Independent Test**: Toggle/reorder/configure sections; confirm config persists and no raw-HTML path.

- [X] T033 [P] [US5] Homepage service/repository in `packages/core/src/homepage/` (section catalog, enable/disable/reorder, per-type config)
- [X] T034 [US5] Homepage route handlers in `apps/admin/app/api/homepage/` (sections, reorder) guarded by `homepage:manage`
- [X] T035 [P] [US5] zod per-section-type config schemas (bounded; reject raw HTML) in `packages/validation/src/`
- [X] T036 [US5] Tests — enable/disable/reorder/config persists; raw-HTML rejected (FR-019, SC-006)

**Checkpoint**: Homepage owner-composable.

---

## Phase 8: User Story 6 - Global site settings (Priority: P2)

**Goal**: Single editable settings record.

**Independent Test**: Edit each field; read back updated values; concurrent edit → 409.

- [X] T037 [P] [US6] Settings service/repository in `packages/core/src/settings/` (singleton get/update)
- [X] T038 [US6] Settings route handlers in `apps/admin/app/api/settings/` guarded by `settings:manage`
- [X] T039 [P] [US6] zod settings schema in `packages/validation/src/`
- [X] T040 [US6] Tests — persist/read all fields, optimistic-concurrency 409

**Checkpoint**: Global config manageable.

---

## Phase 9: Polish & Cross-Cutting Concerns

- [x] T041 [P] MVP end-to-end integration test (SC-001): login → upload media → create client + service → build project referencing them → publish
- [x] T042 [P] Rate limiting on `POST /api/auth/login` (brute-force protection, XVII)
- [x] T043 [P] Housekeeping: expire/cleanup unconfirmed media upload-intents (no orphan rows)
- [x] T044 [P] Extend `.github/workflows/ci.yml` so migrations + the new module tests run against the Postgres service container
- [x] T045 [P] Run all `quickstart.md` scenarios A–I and record results
- [x] T046 Verify **zero UI** shipped, **no raw-HTML** editing path, **no secrets** in source, and all `pnpm build/typecheck/lint/test` green

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2)** blocks everything.
- **US1 (P1)** first after foundational — its session guard is needed to gate/test other routes.
- **US2, US3, US4, US5, US6** depend only on Foundational (schema + content-engine + rbac). They are
  independently testable by seeding prerequisite rows; can be built in parallel after US1.
- **MVP = US1 + US2 + US3** (login → media → publish a project). US4 enriches attribution; US5/US6 follow.
- **Polish** last.

### Within each story
Service/repository (in `packages/core`) → route handler (in `apps/admin`) → zod schema → tests.
Repositories are the only layer touching Prisma; services are unit-tested with mocks.

### Parallel opportunities
- Setup: T002, T003, T004 [P]. Foundational: T008, T009 [P] after T007.
- Within a story, the `[P]` service + schema tasks parallelize; route handlers depend on their service.
- Across stories (after US1): different modules (media / projects / clients-services / homepage /
  settings) are separate files → parallelizable by different developers.

---

## Implementation Strategy

### MVP first (US1 + US2 + US3)
Setup → Foundational → US1 → US2 → US3 → **stop & validate** the SC-001 flow (login → media →
project → publish). Demonstrable CMS core.

### Incremental delivery
US1 (access) → US2 (media) → US3 (projects) → US4 (clients/services) → US5 (homepage) → US6 (settings)
→ Polish. Each is independently testable via the API.

### Parallel team
After US1, split modules: Dev A media, Dev B projects, Dev C clients/services, Dev D homepage/settings.

## Notes
- Backend only — every user-story capability is verified via API/service tests; the admin UI is a
  separate later feature (after theme planning).
- Deny-by-default RBAC, optimistic concurrency (409), archive-not-delete, slug auto-suffix, and
  media delete-protection are cross-cutting invariants — assert them in each module's tests.
- Domain logic in `packages/core` (extractable to a standalone API later); no cross-module DB access.
