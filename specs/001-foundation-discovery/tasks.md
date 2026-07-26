---
description: "Task list for Foundation & Product Discovery"
---

# Tasks: Foundation & Product Discovery

**Input**: Design documents from `/specs/001-foundation-discovery/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: This is an infrastructure feature (FR-020: zero business logic). Test tasks are included
**only where a spec acceptance scenario explicitly requires one** (health-route test, migration
check, cross-contract build-break) — not full TDD.

**Organization**: Tasks are grouped by user story. US1 (discovery review) is code-free and
independent. US2 is the buildable skeleton (MVP). US3 (data layer) and US4 (boot/health) build on US2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 / US4
- Paths follow the monorepo structure in `plan.md` (backend-in-Next.js; no separate `apps/api`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bare monorepo shell

- [X] T001 Initialize pnpm workspace: create `pnpm-workspace.yaml` (`apps/*`, `packages/*`) and root `package.json` with workspace scripts (`build`, `test`, `typecheck`, `lint` delegating to Turborepo)
- [X] T002 Configure Turborepo: create `turbo.json` with `build`/`typecheck`/`lint`/`test` tasks, `build` depending on `^build`, and caching
- [X] T003 [P] Add repo hygiene files at root: `.gitignore`, `.nvmrc` (Node 20), `.npmrc`, and `.env.example` (`DATABASE_URL`/`DIRECT_URL`, `R2_*` placeholders — no secrets, FR-013)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared config + package skeletons that US2/US3/US4 all depend on

**⚠️ CRITICAL**: No code-based user story (US2/US3/US4) can begin until this phase is complete

- [X] T004 Create `packages/config` with shared presets: `tsconfig.base.json`, `eslint.config.mjs` (flat), `prettier.config.mjs`, `tailwind.preset.ts`, and a `package.json` exporting them (FR-009)
- [X] T005 [P] Scaffold `packages/types`: `package.json`, `tsconfig.json` (extends config), `src/index.ts` exporting a shared base type (the cross-package contract, FR-010)
- [X] T006 [P] Scaffold `packages/shared`: `package.json`, `tsconfig.json`, `src/index.ts` with a shared util/constant
- [X] T007 [P] Scaffold `packages/validation`: `package.json` (zod dep), `tsconfig.json`, `src/index.ts` placeholder (depends on `@studioflow/types`)
- [X] T008 [P] Scaffold `packages/ui`: `package.json`, `tsconfig.json`, tailwind preset from `config`, one minimal shared component in `src/`
- [X] T009 [P] Scaffold `packages/db` shell: `package.json` (`prisma`, `@prisma/client`), `prisma/schema.prisma` with datasource + generator only (no models), `src/client.ts` exporting a `PrismaClient` instance
- [X] T010 Wire Turborepo/tsconfig so app builds depend on package builds (upstream), enabling build-time contract-break detection (SC-007)

**Checkpoint**: Foundation ready — user stories can now proceed (US2 first; US3/US4 after US2)

---

## Phase 3: User Story 1 - Shared, ratified product understanding (Priority: P1) 🎯

**Goal**: One authoritative, mutually consistent set of Phase 0 discovery documents.

**Independent Test**: Review `docs/` against `.specify/memory/constitution.md` and each other — no
code required. (Runs independently of all other phases.)

- [X] T011 [US1] Verify every governing principle in `.specify/memory/constitution.md` maps to ≥1 phase in `docs/implementation-plan.md`; record the traceability mapping (FR-002, SC-001)
- [X] T012 [P] [US1] Verify `docs/domain-model.md` has zero orphan entities — every entity participates in ≥1 relationship/flow (FR-003, SC-002)
- [X] T013 [P] [US1] Verify every constitution *Definition of Failure* maps to ≥1 mitigating decision assigned to a phase in `docs/implementation-plan.md` (FR-004)
- [X] T014 [US1] Cross-check discovery docs pairwise for contradictions (`product-vision.md`, `personas.md`, `user-flows.md`, `domain-model.md`, `technical-architecture.md`, `implementation-plan.md`) (FR-005)
- [X] T015 [US1] Record the review outcome (principle traceability + failure-mitigation map + consistency confirmation) in a `docs/discovery-review.md` note confirming US1 acceptance

**Checkpoint**: Discovery artifacts ratified and internally consistent

---

## Phase 4: User Story 2 - Buildable, CI-verified workspace skeleton (Priority: P1) 🎯 MVP

**Goal**: Clone → single install → whole workspace type-checks, lints, builds, and tests, with CI green.

**Independent Test**: Clean checkout in a fresh environment; run install + build/test; confirm CI
reports success across all apps/packages.

- [X] T016 [US2] Scaffold `apps/web` (Next.js 15 App Router) consuming `config` presets + `@studioflow/ui`/`@studioflow/types`, with a default page in `apps/web/app/page.tsx`
- [X] T017 [US2] Scaffold `apps/admin` (Next.js 15 App Router) consuming shared packages, with a default page in `apps/admin/app/page.tsx`
- [X] T018 [P] [US2] In both apps, import a type from `@studioflow/types` and a util from `@studioflow/shared` so the import resolves and type-checks (proves US2 scenario 5)
- [X] T019 [US2] Ensure `pnpm typecheck`, `pnpm lint`, and `pnpm build` pass for **every** app and package (FR-007, FR-008)
- [X] T020 [US2] Add Vitest workspace config and one trivial unit test per package/app so `pnpm test` passes (FR-008)
- [X] T021 [US2] Create `.github/workflows/ci.yml`: install → typecheck → lint → build → test, reporting a single pass/fail (FR-011)
- [X] T022 [P] [US2] Verify the Turborepo build-order guarantee: a deliberate breaking change to a `@studioflow/types` export fails `pnpm typecheck`/CI (SC-007) — per quickstart scenario F, then revert
- [X] T023 [US2] Confirm a clean checkout with no prior local state goes green via the single documented commands: `pnpm install` → `pnpm build` → `pnpm test` (FR-007, FR-012, SC-003)

**Checkpoint**: MVP — buildable, CI-verified skeleton. Deploy/demo possible.

---

## Phase 5: User Story 3 - Verifiable data layer baseline (Priority: P2)

**Goal**: Database provisioned and an empty baseline migration proven against a throwaway DB, in CI.

**Independent Test**: Point migration tooling at a throwaway DB, run the baseline migration, confirm
it completes and the connection is established — no application feature required.

**Depends on**: US2 (workspace + CI exist)

- [X] T024 [US3] Configure the Prisma datasource (PostgreSQL) in `packages/db/prisma/schema.prisma`, reading `DATABASE_URL` from env (no secrets in source, FR-013)
- [X] T025 [US3] Generate the **empty** baseline migration in `packages/db/prisma/migrations/` — migration history + DB prerequisites (e.g. extensions) only, **no domain tables** (FR-014, FR-020)
- [X] T026 [US3] Export a configured Prisma client from `packages/db/src/client.ts` and prove it connects with valid config (FR-013, US3 scenario 2)
- [X] T027 [P] [US3] Add an integration check that `prisma migrate deploy` applies cleanly against a throwaway DB and reports "already up to date" on re-run (US3 scenario 1 + idempotency edge case)
- [X] T028 [US3] Extend `.github/workflows/ci.yml` with a Postgres **service container** and a `migrate` step against the throwaway DB; assert that if the Postgres service is unavailable the migrate step fails clearly and attributably (not as a generic build failure) (FR-015, SC-005)

**Checkpoint**: Data layer connects and migrates cleanly in CI, with no content model

---

## Phase 6: User Story 4 - Each application boots with a health signal (Priority: P2)

**Goal**: Both apps boot locally; the backend exposes a liveness health route; input is globally validated.

**Independent Test**: Start each app locally; issue a request to the health route; confirm a 2xx —
with no business functionality present.

**Depends on**: US2 (apps exist)

- [X] T029 [US4] Implement the liveness health route in `apps/admin/app/api/health/route.ts` returning HTTP 200 `{"status":"ok"}` with **no DB access** (FR-017, contracts/health.md)
- [X] T030 [P] [US4] Add an integration test in `apps/admin/__tests__/health.test.ts` asserting the health route returns 200 and `{"status":"ok"}` (US4 scenario 3, SC-006)
- [X] T031 [US4] Implement the global input-validation helper in `packages/validation/src/index.ts` (zod wrapper + consistent error envelope) and apply it to a sample backend route in `apps/admin` (FR-018, US4 scenario 4)
- [X] T032 [P] [US4] Wire Cloudflare R2 config from env in `apps/admin/lib/media.ts`, asserting config presence/validity with **no live network call** (FR-019)
- [X] T033 [US4] Verify both apps boot locally (`web` + `admin` serve their default pages) and the health route returns 200 (FR-016, SC-006)

**Checkpoint**: Runtime viability confirmed — apps boot, health signal green, input validated

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation, docs, and final consistency

- [X] T034 [P] Run all `quickstart.md` validation scenarios A–G and record the results; include a from-scratch clean install (no cache) to confirm a partial/corrupted dependency cache still yields a green build
- [X] T035 [P] Review that **zero business logic** is present — only skeleton, config, health route, validation layer, and empty baseline migration exist (FR-020, SC-008)
- [X] T036 [P] Write `README.md`: clone → install → build → test, plus free-tier deploy notes (Vercel/Cloudflare Pages + Supabase + Cloudflare R2; ~$10/yr domain)
- [X] T037 Verify the backend-in-Next.js deviation (Constitution VIII) remains documented and consistent across `docs/technical-architecture.md`, `docs/implementation-plan.md`, `spec.md`, and `plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS US2/US3/US4
- **US1 (Phase 3)**: Code-free — depends on nothing; can run any time, even in parallel with Setup
- **US2 (Phase 4)**: Depends on Foundational
- **US3 (Phase 5)**: Depends on US2
- **US4 (Phase 6)**: Depends on US2
- **Polish (Phase 7)**: Depends on all desired stories

### User Story Dependencies

- **US1 (P1)**: Independent (review-only)
- **US2 (P1)**: After Foundational — the MVP skeleton
- **US3 (P2)**: After US2 — independently testable (throwaway DB migration)
- **US4 (P2)**: After US2 — independently testable (boot + health) — **parallel with US3**

### Within Each User Story

- Package skeletons before app scaffolds; apps before CI green; migration before CI migrate step
- Health route before its test; validation helper before applying it to a route

### Parallel Opportunities

- Setup: T003 ∥ (after T001/T002)
- Foundational: T005, T006, T007, T008, T009 all [P] (different packages) after T004
- US1: T012, T013 [P] (independent reviews); the whole of US1 ∥ Setup/Foundational
- US2: T018, T022 [P]
- US3 ∥ US4 once US2 is done (different areas: `packages/db`/CI vs `apps/admin`)
- Polish: T034, T035, T036 [P]

---

## Parallel Example: Foundational package skeletons

```bash
# After T004 (packages/config), scaffold the remaining packages in parallel:
Task: "Scaffold packages/types (src/index.ts exporting a base type)"
Task: "Scaffold packages/shared (src/index.ts util/constant)"
Task: "Scaffold packages/validation (zod, placeholder)"
Task: "Scaffold packages/ui (minimal component)"
Task: "Scaffold packages/db shell (schema datasource + client)"
```

## Parallel Example: US3 and US4 after MVP

```bash
# Developer A takes US3 (data layer), Developer B takes US4 (boot/health) — no shared files:
Task: "US3: Prisma datasource + empty baseline migration + CI migrate step"
Task: "US4: health route + global validation + Cloudflare R2 wiring"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 (discovery ratified) + Phase 4 US2
   (buildable CI-verified skeleton)
4. **STOP and VALIDATE**: clean checkout → `pnpm build` + `pnpm test` green + CI green (SC-003/SC-004)
5. This is a demonstrable MVP: ratified discovery + a green, reproducible skeleton

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → discovery consistency proven (no code)
3. US2 → buildable CI-verified skeleton (MVP) → demo
4. US3 → data layer baseline in CI → demo
5. US4 → apps boot + health + validation → demo
6. Polish → quickstart A–G, README, zero-business-logic review

### Parallel Team Strategy

- One person runs US1 (review) while another does Setup + Foundational + US2
- After US2: split US3 (data layer) and US4 (boot/health) across two developers

---

## Notes

- [P] = different files, no dependencies
- Every code path honors FR-020 (zero business logic): no domain tables, no feature endpoints
- Backend lives inside Next.js (route handlers / server actions) — there is no `apps/api`
- Commit after each task or logical group; stop at any checkpoint to validate a story independently
