# Quickstart & Validation: Core CMS

Backend/API validation — no UI this phase. Each scenario maps to a user story / success criterion and
is exercised via the API + automated tests. Entity/contract detail lives in
[`data-model.md`](./data-model.md) and [`contracts/`](./contracts/).

## Prerequisites

- Phase 1 foundation green (`corepack enable`, `pnpm install`).
- `.env` with Supabase `DATABASE_URL`/`DIRECT_URL` and Cloudflare R2 vars.
- Migrations applied: `pnpm --filter @studioflow/db migrate` (adds the full domain schema).
- A seeded **owner** user + owner role (seed script) to bootstrap access.

## Commands

```bash
pnpm build && pnpm typecheck && pnpm lint     # workspace green
pnpm test                                     # unit + integration (DB tests run when DATABASE_URL set)
pnpm --filter @studioflow/admin dev           # run the backend routes locally
```

---

## Scenario A — Auth & session (US1, FR-004/007)

`POST /api/auth/login` with the owner → 200 + access token + refresh cookie; bad creds → 401;
`POST /api/auth/refresh` rotates; `POST /api/auth/logout` revokes. Unauthenticated call to any admin
route → 401.

## Scenario B — Custom roles & deny-by-default (US1, SC-003)

Create a role with only `projects:edit` (`POST /api/roles`), assign it to a new user, log in as them:
- `PATCH /api/projects/:id` → **allowed**
- `POST /api/projects/:id/status {publish}` → **403** (lacks `projects:publish`), no state change
- `GET /api/permissions` returns the fixed catalog. Deleting a role still assigned → **409**.

## Scenario C — Media library reuse & protection (US2, SC-004)

Upload-intent → presigned PUT → confirm (image ≤10MB). Reference the same asset from two projects →
`usageCount` = 2, **no re-upload**. `DELETE` that asset → **409 blocked**. Oversized/unsupported
upload-intent → **422**.

## Scenario D — Projects as case studies (US3, SC-005)

`POST /api/projects {title}` only → 201 Draft. `PATCH` to attach media refs + client + services +
challenge/solution/results + SEO. `POST /status {publish}` → Published, `publishedAt` stamped;
archive + restore work. Missing title → 422. Second project titled the same → slug auto-suffixed
(`-2`).

## Scenario E — Clients & Services + archive-not-delete (US4)

Create client + service (+ sub-service), reorder. Reference them from a project. `DELETE` a
referenced client/service → **409 blocked**; **Archive** it instead → succeeds, project reference
stays valid.

## Scenario F — Homepage & settings (US5, US6, SC-002/006)

Toggle/reorder/configure homepage sections (`PATCH`, `reorder`) — config validated per section type;
no raw-HTML path exists. `PATCH /api/settings` persists the singleton and reads back updated values.

## Scenario G — Optimistic concurrency (FR-025)

Read a project (version N), send two `PATCH`es with version N: the first → 200 (version N+1), the
second → **409 Conflict** (no silent lost update).

## Scenario H — Input validation (SC-007)

For representative write routes: malformed JSON → 400; schema-invalid body → 422; unauthorized →
403. Proven by tests submitting bad + unauthorized requests.

## Scenario I — MVP flow (SC-001)

End-to-end (integration test): login → upload media → create a client + a service → build a project
referencing them → publish. Confirms the full P1 slice works via the API.

---

## Definition of Done (Phase 2 exit)

- [ ] Scenarios A–I pass (as automated tests where DB is available)
- [ ] `pnpm build/typecheck/lint/test` green; RBAC policy tests + validation tests included
- [ ] All 9 modules present in `packages/core` with thin route handlers in `apps/admin`
- [ ] Zero UI shipped (backend only); no raw-HTML editing path; no secrets in source
