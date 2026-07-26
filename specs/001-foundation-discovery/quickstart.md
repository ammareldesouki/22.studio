# Quickstart & Validation: Foundation & Product Discovery

Runnable checks that prove Phase 1 works end-to-end. Each scenario maps to a user story / success
criterion. Details of the entities and contracts live in [`data-model.md`](./data-model.md) and
[`contracts/`](./contracts/) — this file is the **run guide**, not the implementation.

## Prerequisites

- Node.js 20 LTS, pnpm 9
- A PostgreSQL connection string (throwaway/test DB — local Docker, or a free Supabase project)
- Copy `.env.example` → `.env` and set `DATABASE_URL`/`DIRECT_URL` (and `R2_*` vars for config wiring)

## Setup (single command)

```bash
pnpm install
```

Expected: one install wires all apps + packages via the workspace protocol.

---

## Scenario A — Discovery artifacts are consistent (US1, SC-001/SC-002)

Review-only, no code. Confirm against `docs/` + `.specify/memory/constitution.md`:

- [ ] Every governing principle traces to ≥1 phase (FR-002)
- [ ] Domain model has zero orphan entities (FR-003, SC-002)
- [ ] Every Definition of Failure maps to ≥1 mitigating decision (FR-004)
- [ ] No contradictions across discovery documents (FR-005)

## Scenario B — Clean build, typecheck, lint, test (US2, SC-003/SC-004)

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

Expected: all pass for **every** app and package. Target: clone→green in **<15 min** (SC-003).

## Scenario C — Baseline migration on a throwaway DB (US3, SC-005)

```bash
pnpm --filter @studioflow/db exec prisma migrate deploy
```

Expected: the **empty** baseline applies successfully; schema is at baseline state with **no domain
tables** (FR-014). Re-running reports "already up to date" (idempotent — spec edge case).

## Scenario D — Apps boot + health route (US4, SC-006)

```bash
pnpm --filter @studioflow/web dev      # public site serves its default page
pnpm --filter @studioflow/admin dev    # CMS serves its default page
curl -i http://localhost:<ADMIN_PORT>/api/health   # <ADMIN_PORT> = admin dev-server port (set when apps/admin is scaffolded in T017)
```

Expected: both apps boot without error; health route returns **HTTP 200** `{"status":"ok"}` —
**without** touching the DB (liveness only; see [`contracts/health.md`](./contracts/health.md)).

## Scenario E — Global input validation (FR-018)

Submit malformed input to a validated backend route.
Expected: rejected by the shared validation layer with a consistent error envelope before any
handler logic runs (proves "never trust unvalidated input").

## Scenario F — Cross-contract build safety (SC-007)

Deliberately change an exported type in `packages/types` so a consumer no longer matches, then:

```bash
pnpm typecheck
```

Expected: **fails** (the break surfaces at build/type-check, not runtime). Revert to restore green.
See [`contracts/package-contracts.md`](./contracts/package-contracts.md).

## Scenario G — CI is green (US2 scenario 4, FR-011/FR-015)

Open a pull request. Expected: GitHub Actions runs `install → typecheck → lint → build → test →
migrate` (migration against a throwaway Postgres **service container**) and reports a **single green**
result.

---

## Definition of Done (Phase 1 exit)

- [ ] Scenarios A–G pass
- [ ] `pnpm build` and `pnpm test` pass on a clean checkout (FR-012)
- [ ] Zero business logic present — only skeleton, config, health route, validation layer, empty
      baseline migration (FR-020, SC-008)
