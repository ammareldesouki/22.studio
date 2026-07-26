# AGENTS.md — StudioFlow implementation guide

> Read this before implementing. It is the binding rule set for any coding agent (OpenCode,
> DeepSeek, etc.) working in this repo. The **spec is the source of truth**; if a task conflicts
> with the spec/plan, **stop and flag it** — do not improvise.

## How work flows here

1. Specs are authored/clarified/planned and broken into tasks by the human + Claude Code.
2. **You implement one phase at a time** from `specs/<feature>/tasks.md`, in task-ID order.
3. After a phase, the human returns to Claude Code for review / verification / `/speckit-analyze`.
4. Only start a phase when its dependencies (earlier phases) are complete.

Active feature: `specs/001-foundation-discovery/` — read `spec.md`, `plan.md`, `tasks.md`,
`research.md`, `data-model.md`, `contracts/`, `quickstart.md`.

## Binding architecture (do NOT deviate)

Full detail in `docs/technical-architecture.md`. Key rules:

- **Two Next.js 15 apps only**: `apps/web` (public) and `apps/admin` (CMS). **No separate API
  server** — the backend lives inside Next.js (route handlers / server actions). Never create
  `apps/api` or add NestJS.
- **Backend layering** is still required: route handler / server action → service → repository →
  Prisma. Data access (Prisma) is **server-side only**, isolated in `packages/db`, never imported
  into client code.
- **Packages** use the **raw-source pattern**: `main`/`exports` point at `src/*.ts`; tsconfig is
  `noEmit: true` (no build step, no `dist`, no `composite`). Apps consume them via
  `transpilePackages: ["@studioflow/..."]`. Do not switch packages to a compiled/`dist` layout.
- **Shared config lives once** in `packages/config` (tsconfig/eslint/prettier/tailwind). Extend it;
  don't duplicate config.
- **Validation**: use zod via `@studioflow/validation`; the backend never trusts client input.
- **Media**: Cloudflare R2 (S3-compatible, free egress), referenced by id from `packages/db`; never
  re-upload. Images via Cloudflare transforms; heavy video via YouTube/Vimeo embeds. Env vars:
  `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`.

## Phase 1 hard constraint

Phase 1 (Foundation) is **infrastructure only — ZERO business logic** (FR-020). No content models,
no feature endpoints, no domain tables. The baseline Prisma migration is **empty** (migration
history + extensions only). The health route is **liveness only** (HTTP 200, no DB access).

## Environment & commands

- Package manager: **pnpm 9** (`packageManager: pnpm@9.15.4`). If `pnpm` on the machine is a
  different major, run `corepack enable` once so `pnpm` matches the pin.
- Monorepo: **Turborepo**. `turbo.json` uses the `tasks` key (Turbo 2.x) — never `pipeline`.
- Every phase must leave these green:
  ```
  pnpm install
  pnpm build        # includes prisma generate for @studioflow/db
  pnpm typecheck    # all packages/apps
  pnpm lint
  pnpm test         # once tests exist
  ```
- **Database: Supabase Postgres.** The app uses the **pooled** URL (`DATABASE_URL`, PgBouncer
  port 6543, `connection_limit=1`); Prisma migrations use the **direct** URL (`DIRECT_URL`, port
  5432) via `directUrl` in `schema.prisma`. Both must be set wherever migrations run (local + CI).
- DB-touching tests (Prisma `$connect`/`$queryRaw`) MUST be skipped when `DATABASE_URL` is unset
  (e.g. `describe.skipIf(!process.env.DATABASE_URL)`) so `pnpm test` stays green on a fresh clone.
- Never commit secrets. Use `.env` (gitignored); `.env.example` documents the keys.
- Commit the updated `pnpm-lock.yaml`.

## When done with a phase

- Ensure the phase's tasks are complete and the commands above pass.
- Update the checkboxes in `tasks.md` for the tasks you finished.
- Hand back to the human for Claude Code review; do not start the next phase's user story until
  review passes.
