# Phase 0 Research: Core CMS

Decisions that turn the clarified spec + locked stack into a buildable backend. The five clarify
answers (custom RBAC, backend-only, optimistic concurrency, archive-not-delete, slug auto-suffix,
permission catalog) are treated as settled inputs. No open `NEEDS CLARIFICATION` remain.

## 1. Content Engine base (shared by all content types)

- **Decision**: Implement the base as **Prisma model composition + a service mixin**. Each content
  model (Project, Service, Client, HomepageSection, Testimonial, Page) carries the same columns:
  `status` (DRAFT|PUBLISHED|ARCHIVED), `slug`, `featured`, embedded SEO fields, `createdBy`/
  `updatedBy`, `createdAt`/`updatedAt`/`publishedAt`, `locale`, `version`. A shared
  `content-engine` service provides status transitions, slug generation, and version bumping so
  every module reuses one implementation.
- **Rationale**: Uniform CMS, cheap new content types (XVI), single place for lifecycle + slug +
  concurrency logic (XVIII).
- **Alternatives**: A single polymorphic `Content` table — rejected (weak typing, awkward relations).

## 2. Authentication & sessions

- **Decision**: Email + password login. Passwords hashed with **argon2**. Issue a short-lived
  **access JWT** (signed with `jose`) kept in memory, and a long-lived **refresh token** in an
  **httpOnly, Secure, SameSite** cookie; `/auth/refresh` rotates it; logout invalidates it via a
  server-side refresh-token store (revocation list / rotation). Basic **rate limiting** on login.
- **Rationale**: Matches `technical-architecture.md` §5 and XVII; httpOnly refresh avoids XSS token
  theft; rotation enables logout/invalidation.
- **Alternatives**: Long-lived access token in localStorage — rejected (XSS risk). Third-party auth
  (Supabase Auth/Clerk) — rejected for v1 (keeps auth in our RBAC model, no extra dependency/cost).

## 3. RBAC — custom roles + fixed permission catalog

- **Decision**: A **fixed permission catalog** (constant in `packages/types`) of `module:action`
  strings (e.g. `projects:create|edit|publish|delete`, `media:upload|delete`, `clients:manage`,
  `services:manage`, `homepage:manage`, `users:manage`, `roles:manage`, `settings:manage`). A
  **Role** stores a selected subset. Every route handler runs a **policy check** (`requirePermission`)
  **deny-by-default** before the service runs. One immutable **owner role** holds all permissions.
- **Rationale**: Custom roles per clarify Q1, but bounded/testable via a fixed catalog (not free-form).
- **Alternatives**: Free-form permission strings — rejected (untestable, unsafe). Fixed roles only —
  rejected by clarify.

## 4. Optimistic concurrency

- **Decision**: Every editable record carries `version` (int). Updates send the expected version;
  the repository performs a conditional update (`WHERE id = ? AND version = ?`) and increments it; a
  0-row result → **409 Conflict**. Applied uniformly via a `content-engine` helper.
- **Rationale**: Clarify Q2 (no silent lost updates); cheap, DB-enforced, no locks held.
- **Alternatives**: Last-write-wins (rejected — data loss); pessimistic locks (rejected — overkill).

## 5. Referential integrity (archive-not-delete)

- **Decision**: Content types are retired via **Archive** (soft), not hard-deleted, while referenced.
  A Client/Service referenced by any project **cannot be hard-deleted** (mirrors Media
  delete-protection). Media with `usageCount > 0` cannot be deleted. Usage counts are maintained
  transactionally when references are added/removed.
- **Rationale**: Clarify Q3 + FR-011/FR-015; no dangling references, attribution preserved.
- **Alternatives**: Cascade/null references — rejected (silent data change).

## 6. Slug generation

- **Decision**: Generate from title (lowercase, hyphenated, transliterated); on collision within a
  type, append `-2`, `-3`, …; manual edits re-validated for per-type uniqueness (DB unique index).
- **Rationale**: Clarify Q4; standard CMS behavior, no editor friction.

## 7. Media pipeline (Cloudflare R2)

- **Decision**: Upload via **short-lived presigned PUT URLs** (S3 API, `@aws-sdk/client-s3`): the
  backend validates type/size + records intent, returns a presigned URL, the client uploads directly
  to R2 (free egress, no server bandwidth), then confirms → the backend persists the `Media` row.
  Orphan avoidance: a `Media` row is only finalized on confirmed upload; unconfirmed intents expire.
- **Upload limits** (resolving the clarify "Deferred" item): **images** ≤ **10 MB**
  (`jpeg,png,webp,avif,svg`); **short video** ≤ **100 MB** (`mp4,webm`); **longer video** via
  YouTube/Vimeo references (no self-hosting). Delivery uses R2 public URL + Cloudflare image
  transforms.
- **Rationale**: Presigned direct upload keeps serverless functions light and egress free (media
  memory). Limits keep the R2 free tier viable and validation deterministic.
- **Alternatives**: Server-proxied upload — rejected (streams large files through the function).

## 8. Pagination

- **Decision**: **Keyset/cursor pagination** on all list endpoints (order by `createdAt,id`), with a
  bounded page size. Indexes on `slug` (unique per type), `status`, `publishedAt`, `featured`, FKs.
- **Rationale**: Responsive at 1,000+ items now (SC-008), scales to ~20k later (IX) without redesign.
- **Alternatives**: Offset pagination — rejected (slow deep pages at scale).

## 9. Validation

- **Decision**: One **zod schema per entity/action** in `packages/validation`, applied through the
  `withValidation` wrapper (from Phase 1) at every write route; a shared error envelope. Authorization
  (RBAC) runs before validation-heavy work; validation before the service.
- **Rationale**: FR-022 / XVII "never trust client input"; reuses the Phase 1 wrapper.

## 10. Module boundaries & structure

- **Decision**: Domain modules in **`packages/core`** (service + repository each), thin route
  handlers in `apps/admin/app/api/*`. Modules communicate only through explicit service interfaces;
  no cross-module DB access.
- **Rationale**: VIII isolation; future `apps/api` extraction is additive; Phase 3 `web` can import
  read-side services. Repositories are the only layer touching Prisma (mockable services).

## 11. Testing strategy

- **Decision**: Vitest. Per module: **unit** (service logic + repository with mocked Prisma),
  **integration** (route handler → real test Postgres), **RBAC policy tests** (each permission:
  allowed vs denied), **validation tests** (malformed + unauthorized rejected), and a **cross-module
  flow test** for SC-001 (login → upload media → create client/service → build project → publish).
  DB tests gated by `DATABASE_URL`; CI runs them against the Postgres service container.
- **Rationale**: Backend-only means API/service tests are the acceptance surface (no UI/e2e yet).

## Open risks (tracked)

- **Serverless DB connections** — use the Supabase pooler + Prisma connection limits under load.
- **Presigned-upload confirm step** — needs a cleanup job for expired unconfirmed intents (small,
  Phase 2 tail or Phase 4 housekeeping).
