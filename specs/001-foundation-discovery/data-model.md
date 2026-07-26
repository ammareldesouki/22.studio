# Phase 1 Data Model: Foundation & Product Discovery

**Scope note**: This feature is **infrastructure + discovery only (FR-020: zero business logic)**.
The **domain/content** entities (Project, Service, Client, Media, User, Role, …) are defined in
[`docs/domain-model.md`](../../docs/domain-model.md) and **built in Phase 2 onward — not here**. The
Phase 1 baseline migration therefore creates **no domain tables**.

The entities below are the **foundation-level** structural entities from the spec (Key Entities).
They are largely conceptual/structural (workspace artifacts), not persisted rows — except where noted.

---

## Foundation entities

### Discovery Artifact *(Phase 0 — document, not persisted)*

A ratified discovery document under `docs/`.

| Attribute | Description |
|---|---|
| purpose | What the document establishes (principles, vision, personas, flows, domain, plan) |
| principlesAddressed | Which Constitution principles it exercises (FR-002 traceability) |
| consistencyRelationships | Other artifacts it must not contradict (FR-005) |

**Validation rules**: every governing principle traces to ≥1 phase (FR-002); no orphan domain entity
(FR-003); every Definition of Failure maps to ≥1 mitigating decision (FR-004); no cross-document
contradictions (FR-005). Verified by review, no code required (US1 Independent Test).

### Workspace *(structural)*

The monorepo container.

| Attribute | Description |
|---|---|
| apps | `apps/web`, `apps/admin` |
| packages | `db`, `types`, `validation`, `ui`, `shared`, `config` |
| sharedConfig | one tsconfig/eslint/prettier/tailwind source (FR-009) |
| commands | single-command install, build, typecheck, lint, test (FR-007, FR-008) |

**Validation rules**: apps depend only on `packages/*`, never on each other; `pnpm build`/`pnpm test`
pass on a clean checkout (FR-012).

### Application *(structural, deployable)*

A deployable Next.js app.

| Attribute | Description |
|---|---|
| name | `web` (public) or `admin` (CMS + backend) |
| bootStatus | boots locally without error (FR-016) |
| healthSignal | `admin` backend exposes liveness route `GET /api/health` → 200 (FR-017) |

**State**: booted / not-booted. No feature routes in Phase 1 (default page only).

### Shared Package *(structural)*

A reusable internal library consumed via `workspace:*`.

| Package | Responsibility |
|---|---|
| `db` | Prisma client + schema + migrations (server-side only) |
| `types` | shared TypeScript types (contract) |
| `validation` | shared zod schemas + global-validation helper (FR-018) |
| `ui` | shared shadcn/ui components (web + admin) |
| `shared` | shared utilities/constants |
| `config` | eslint/prettier/tsconfig/tailwind presets (FR-009) |

**Validation rules**: a break in an exported contract must fail dependents' `typecheck`/`build`
(FR-010, SC-007).

### Baseline Migration *(persisted — migration metadata only)*

The initial Prisma migration.

| Attribute | Description |
|---|---|
| scope | migration history + DB-level prerequisites (e.g. extensions) |
| domainTables | **none** (FR-014, FR-020) |
| target | applies cleanly against a throwaway/test DB (US3), including in CI (FR-015) |
| idempotency | re-running reports "already up to date" rather than erroring (spec Edge Case) |

**State**: not-applied → applied (baseline). `prisma migrate deploy` is the apply operation.

---

## Relationships (foundation)

```text
Workspace ──contains──► Application (web, admin)
Workspace ──contains──► Shared Package (db, types, validation, ui, shared, config)
Application ──depends on──► Shared Package        (never on another Application)
Shared Package (db) ──owns──► Baseline Migration ──applies to──► PostgreSQL
Discovery Artifact ──consistent with──► Discovery Artifact   (FR-005)
```

## Deferred (Phase 2+)

All content/operational entities and the Content Engine base live in
[`docs/domain-model.md`](../../docs/domain-model.md): Project, Service, SubService, Client,
HomepageSection, Testimonial, Page, Media, Folder, Message, User, Role, Settings. **None are created
by this feature's migration.**
