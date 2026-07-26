# OpenCode phase prompts — 001-foundation-discovery

Paste-in prompts for implementing each phase with **OpenCode + DeepSeek**, one phase at a time.
After each phase, return to Claude Code for `/code-review`, `/verify`, and `/speckit-analyze`.

**Order:** US2 → (US3 and US4, either order — independent) → Polish.
**US1** (Shared, ratified product understanding) is a **code-free discovery review** — do it with
Claude Code / by hand, not OpenCode.

**Before running:** `corepack enable` once (so `pnpm` = the pinned 9.15.4). Every phase must leave
`pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` green.

---

## Phase 4 — US2: Buildable, CI-verified skeleton (T016–T023)


```

---

## Phase 5 — US3: Data layer baseline (T024–T028)

```
Read AGENTS.md and specs/001-foundation-discovery/{spec.md,plan.md,tasks.md,quickstart.md}
and docs/technical-architecture.md §4.
Implement ONLY Phase 5 (User Story 3, tasks T024–T028).

Note: packages/db already exists (schema.prisma has datasource+generator; src/client.ts exports a
Prisma singleton). Do NOT rewrite those — complete the remaining work:
- T024: confirm datasource reads DATABASE_URL from env (no secrets in source).
- T025: create the EMPTY baseline migration in packages/db/prisma/migrations/ — migration history +
  DB prerequisites (extensions) only. NO domain tables (FR-014/FR-020).
- T026: prove the client connects with valid config.
- T027: add an integration check that `prisma migrate deploy` applies cleanly on a throwaway DB and
  reports "already up to date" on a second run (idempotent).
- T028: extend .github/workflows/ci.yml with a Postgres service container + a migrate step against
  the throwaway DB; make a DB-unavailable failure clear/attributable (not a generic build failure).

When done: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass; tick T024–T028 in
tasks.md; stop. Do not touch US4 or add any domain/content models.
```

---

## Phase 6 — US4: Apps boot + health signal (T029–T033)

```
Read AGENTS.md and specs/001-foundation-discovery/{spec.md,plan.md,tasks.md,contracts/health.md}.
Implement ONLY Phase 6 (User Story 4, tasks T029–T033). Requires US2 (apps exist).

- T029: liveness health route at apps/admin/app/api/health/route.ts → HTTP 200 {"status":"ok"},
  with NO database access (liveness only).
- T030: integration test apps/admin/tests/health.test.ts asserting 200 + {"status":"ok"}.
- T031: a global input-validation layer using @studioflow/validation (a validate() zod wrapper
  already exists there) — apply it to a sample backend route in apps/admin with a consistent error
  envelope. Backend never trusts client input.
- T032: initialize Cloudflare R2 config from env in apps/admin/lib/media.ts; assert config
  presence/validity but make NO live network call.
- T033: verify both apps boot locally (web + admin serve their default page) and the health route
  returns 200.

When done: `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass; tick T029–T033 in
tasks.md; stop. No domain/content features.
```

---

## Phase 7 — Polish & cross-cutting (T034–T037)

```
Read AGENTS.md and specs/001-foundation-discovery/{spec.md,tasks.md,quickstart.md}.
Implement ONLY Phase 7 (tasks T034–T037).

- T034: run all quickstart.md scenarios A–G and record results; include a from-scratch clean install
  (no cache) to confirm a green build.
- T035: review that ZERO business logic exists — only skeleton, config, health route, validation
  layer, empty baseline migration (FR-020/SC-008).
- T036: write README.md — clone → install → build → test, plus free-tier deploy notes
  (Vercel/Cloudflare Pages + Supabase + Cloudflare R2; ~$10/yr domain).
- T037: verify the backend-in-Next.js deviation stays documented + consistent across
  docs/technical-architecture.md, docs/implementation-plan.md, spec.md, plan.md.

When done: all green; tick T034–T037; stop.
```

---

## The loop, per phase

1. Paste the phase prompt into OpenCode + DeepSeek → it implements + self-verifies.
2. Return to Claude Code → `/code-review`, `/verify`, `/speckit-analyze` against the spec.
3. Clean → next phase. Issues → Claude hands you a fix prompt for OpenCode.
