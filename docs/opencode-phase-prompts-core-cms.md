# OpenCode phase prompts — 002-core-cms (Backend only)

Paste-in prompts for implementing Core CMS with **OpenCode + DeepSeek**, one phase at a time. After
each phase, return to Claude Code for `/code-review`, `/verify`, and (per story) `/speckit-analyze`.

**Order:** Foundation → US1 → US2 → US3 → (US4, US5, US6 — independent after US1) → Polish.
**MVP:** Foundation + US1 + US2 + US3.

**Global rules (also in `AGENTS.md`):** backend/API only — **NO admin UI/screens this phase**;
domain logic in `packages/core` (services + repositories), thin route handlers in
`apps/admin/app/api/*`; Prisma models in `packages/db`; zod in `packages/validation`; permission
catalog in `packages/types`. Deny-by-default RBAC, optimistic concurrency (409), archive-not-delete,
slug auto-suffix, media delete-protection. Supabase Postgres, Cloudflare R2. Every phase must leave
`pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` green; DB tests skip when `DATABASE_URL` unset.

**USE the `@studioflow/core` content-engine helpers (do NOT reimplement):**
- **Updates** → conditional write + `assertVersionedUpdate(count)`:
  `const { count } = await tx.<model>.updateMany({ where: { id, version: expected }, data: { ...fields, version: { increment: 1 } } }); assertVersionedUpdate(count);` — never read-then-compare.
- **Inserts with a slug** → `slugify(title)` then `createWithUniqueSlug(base, (slug) => tx.<model>.create(...))` (handles the P2002 race).
- **SEO** → `seoToColumns()` on write, `columnsToSeo()` on read (never hand-map the flat `seo*` columns).
- **Media references** → `adjustUsageCount(tx, mediaId, +1|-1)` inside the same transaction as the ref change (floored at 0).
- **Pagination** → `parsePageParams` + the shared `DEFAULT_PAGE_LIMIT`/`MAX_PAGE_LIMIT` from `@studioflow/types`.
- **RBAC** → `requirePermission(principal, PERMISSIONS.X)` in every write route (deny-by-default).

---

## Phase A — Setup + Foundational (T001–T011)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,plan.md,tasks.md,research.md,data-model.md} and
specs/002-core-cms/contracts/. Implement ONLY Phase 1 (Setup, T001–T004) and Phase 2 (Foundational,
T005–T011).

- Scaffold packages/core (module subdirs per plan) with typecheck/lint/test scripts + vitest.config.
- Add deps: bcryptjs, jose, @aws-sdk/client-s3 + s3-request-presigner (to packages/core).
- Add the fixed permission catalog + Permission type in packages/types.
- Extend packages/db/prisma/schema.prisma with ALL models/enums/indexes/join tables per data-model.md
  (Content Engine base on content types; User/Role/Media/Folder/Client/Service/SubService/Project/
  HomepageSection/Testimonial/Page/Settings; ProjectService/ProjectMedia(typed)/RelatedProject).
- Generate + apply the migration to Supabase; verify with migrate:verify.
- Implement content-engine (status transitions, slug + auto-suffix, optimistic-concurrency helper),
  shared helpers (keyset pagination, error envelope, usage-count tx), rbac requirePermission
  (deny-by-default), the apps/admin session/guard middleware, and the owner seed script.

Hard rules: NO UI. Do not implement any module's endpoints yet. Leave pnpm build/typecheck/lint/test
green; tick T001–T011 in tasks.md; stop.
```

---

## Phase B — US1: Auth + Users + Roles (T012–T019)

```

---

## Phase C — US2: Media Library (T020–T023)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,tasks.md,data-model.md} and
specs/002-core-cms/contracts/media.md. Requires Phase A (US1 recommended for guard/tests).
Implement ONLY Phase 4 / User Story 2 (T020–T023).

- packages/core/media: presigned direct-to-R2 upload (upload-intent validates type/size → presigned
  PUT; confirm finalizes the Media row; no orphan rows), folders, tags, usage-count, delete-protection.
- apps/admin route handlers: /api/media (upload-intent, [id]/confirm, list+filter, patch, delete) and
  /api/folders — guarded by media:upload / media:delete.
- zod schemas: image ≤10MB (jpeg,png,webp,avif,svg), video ≤100MB (mp4,webm); YouTube/Vimeo stored as
  a Media row with URL (no upload).
- Tests: reuse → usageCount=2, delete-protection 409 (SC-004), invalid upload 422.

NO UI. Full gate green; tick T020–T023; stop.
```

---

## Phase D — US3: Projects (T024–T027)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,tasks.md,data-model.md} and
specs/002-core-cms/contracts/projects.md. Requires Phase A.
Implement ONLY Phase 5 / User Story 3 (T024–T027).

- packages/core/projects: CRUD; ProjectMedia(typed: gallery/video/before_after + order),
  ProjectService, RelatedProject refs with TRANSACTIONAL Media usageCount adjust; publish lifecycle +
  publishedAt; per-project SEO; optimistic concurrency.
- apps/admin route handlers: /api/projects (+[id]/status) guarded by
  projects:create|edit|publish|delete.
- zod: title REQUIRED, everything else optional.
- Tests: title-only Draft saves; refs stored without duplicating media; publish stamps publishedAt;
  archive/restore; duplicate title → slug auto-suffix (-2); two concurrent PATCHes at same version →
  second 409 (FR-025).

NO UI. Full gate green; tick T024–T027; stop.
```

---

## Phase E — US4: Clients & Services (T028–T032)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,tasks.md,data-model.md} and
specs/002-core-cms/contracts/clients-services.md. Requires Phase A.
Implement ONLY Phase 6 / User Story 4 (T028–T032).

- packages/core: clients (CRUD, order, archive-not-delete-when-referenced), services + subservices.
- apps/admin route handlers: /api/clients and /api/services (+reorder, +status, +subservices) guarded
  by clients:manage / services:manage.
- zod schemas for clients/services.
- SCHEMA MIGRATION (deferred from Phase A per data-model.md): add explicit `onDelete: Restrict` to
  referenced relations (Project.client, *.logo/iconMedia, ProjectMedia.media, ProjectService.service)
  and `onDelete: Cascade` to join-row parents (ProjectMedia.project, ProjectService.project,
  RelatedProject.*); generate + apply the migration.
- Tests: create/reorder, reference from a project, hard-delete-while-referenced → 409, archive succeeds.

NO UI. Full gate green; tick T028–T032; stop.
```

---

## Phase F — US5: Homepage (T033–T036)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,tasks.md,data-model.md} and
specs/002-core-cms/contracts/homepage-settings.md. Requires Phase A.
Implement ONLY Phase 7 / User Story 5 (T033–T036).

- packages/core/homepage: section catalog (HERO|SERVICES|PROJECTS|CLIENTS|STATS|TESTIMONIALS|FAQ|CTA),
  enable/disable/reorder, per-type config.
- apps/admin route handlers: /api/homepage (sections, reorder) guarded by homepage:manage.
- zod: bounded per-section-type config; REJECT raw HTML.
- Tests: toggle/reorder/config persists; raw-HTML rejected (FR-019, SC-006).

NO UI. Full gate green; tick T033–T036; stop.
```

---

## Phase G — US6: Settings (T037–T040)

```
Read AGENTS.md and specs/002-core-cms/{spec.md,tasks.md,data-model.md} and
specs/002-core-cms/contracts/homepage-settings.md. Requires Phase A.
Implement ONLY Phase 8 / User Story 6 (T037–T040).

- packages/core/settings: singleton get/update (siteName, logoId, socialLinks, seoDefaults,
  analyticsIds, contact) with version.
- apps/admin route handlers: /api/settings guarded by settings:manage.
- zod settings schema.
- Tests: persist/read all fields; concurrent edit → 409.

NO UI. Full gate green; tick T037–T040; stop.
```

---

## Phase H — Polish (T041–T046)

```
Read AGENTS.md and specs/002-core-cms/{tasks.md,quickstart.md}.
Implement ONLY Phase 9 (T041–T046).

- MVP end-to-end integration test (SC-001): login → upload media → create client + service → build a
  project referencing them → publish.
- Rate limiting on /api/auth/login.
- Cleanup of expired unconfirmed media upload-intents (no orphan rows).
- Extend .github/workflows/ci.yml so migrations + all new module tests run against the Postgres
  service container.
- Run quickstart.md scenarios A–I and record results.
- Verify NO UI shipped, no raw-HTML path, no secrets; full gate green.

Tick T041–T046; stop.
```

---

## The loop, per phase
1. Paste the phase prompt into OpenCode + DeepSeek → it implements + self-verifies.
2. Return to Claude Code → `/code-review`, `/verify`, `/speckit-analyze` against the spec.
3. Clean → next phase. Issues → Claude hands you a fix prompt for OpenCode.
