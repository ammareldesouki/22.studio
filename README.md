# StudioFlow

A premium **portfolio + content-management platform for creative studios**. Two Next.js apps over a
shared domain: a public website and a CMS — with the CMS treated as a first-class product.

> **Status:** Foundation (Phase 1) complete — buildable, CI-verified monorepo skeleton with **zero
> business logic**. Content modules begin in Phase 2. See
> [`docs/implementation-plan.md`](docs/implementation-plan.md).

## Stack (free-tier by design — ~$0/month + ~$10/yr domain)

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Apps | `apps/web` (public) · `apps/admin` (CMS + backend) — **Next.js 15**, backend built in (route handlers / server actions), **no separate API server** |
| Packages | `db`, `types`, `validation`, `ui`, `shared`, `config` |
| Database | **Supabase** Postgres + Prisma (pooled `DATABASE_URL` for the app, direct `DIRECT_URL` for migrations) |
| Media | **Cloudflare R2** (free egress) + Cloudflare image transforms; video via YouTube/Vimeo |
| Auth | JWT + refresh + RBAC (Phase 2) |
| Hosting | Vercel (Hobby) or Cloudflare Pages |

Backend-in-Next.js is a documented, reversible deviation from a separate-API design — see
[`docs/technical-architecture.md`](docs/technical-architecture.md) §3.

## Prerequisites

- **Node 20** and **pnpm 9** — run `corepack enable` once so `pnpm` matches the pinned version.
- A **Supabase** project (free) for the database.
- *(Later, for media)* a **Cloudflare R2** bucket + API token.

## Setup

```bash
corepack enable            # once — pins pnpm 9.15.4
pnpm install               # single install across all apps + packages
cp .env.example .env       # then fill in DATABASE_URL / DIRECT_URL (Supabase → Connect → ORMs → Prisma)
```

## Everyday commands

```bash
pnpm build       # build every app + package (runs prisma generate for @studioflow/db)
pnpm typecheck   # type-check all workspaces
pnpm lint        # ESLint (shared flat config in packages/config)
pnpm test        # Vitest — DB-touching tests skip automatically when DATABASE_URL is unset
pnpm dev         # run the apps locally
```

Database (needs `.env` with your Supabase URLs):

```bash
pnpm --filter @studioflow/db generate        # regenerate the Prisma client
pnpm --filter @studioflow/db migrate         # apply migrations (prisma migrate deploy)
pnpm --filter @studioflow/db migrate:verify  # apply + prove idempotency on a re-run
```

## Project structure

```text
apps/
  web/     public site (Next.js 15, App Router)
  admin/   CMS + backend (route handlers, server actions)
packages/
  db/ types/ validation/ ui/ shared/ config/
docs/      product discovery + architecture (Phase 0)
specs/     Spec Kit feature specs, plans, tasks
```

## Deploying free

1. **Push to GitHub** — CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → build →
   test → migrate (against a throwaway Postgres).
2. **Vercel** (or **Cloudflare Pages**) — import the repo, deploy `apps/web` and `apps/admin` as two
   projects; add the env vars from `.env.example` in each project's settings.
3. **Supabase** provides the database; **Cloudflare R2** stores media.
4. **Domain** (~$10/yr) — attach a custom domain in Vercel/Cloudflare (free SSL).

Total recurring cost: **$0/month** plus the domain.

## Never commit secrets

`.env` is gitignored. Only `.env.example` (placeholders) is tracked.
