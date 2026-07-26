# Contract: Shared package exports & build-time type safety

Phase 1's most important "interface" is not an HTTP API — it is the **cross-package contract** that
lets apps consume shared code and makes a broken contract fail the build (FR-010, SC-007).

## Consumption contract

- Apps depend on packages via the workspace protocol (`"@studioflow/<pkg>": "workspace:*"`).
- Apps import **only** from `packages/*` — never from another app.
- `packages/db` (Prisma client) is imported **only by server-side code** (route handlers, server
  actions, server components). It MUST NOT be bundled into client code (secrets/DB safety, XVII).

## Exported surfaces (Phase 1 — minimal, no business logic)

| Package | Exports (Phase 1) | Consumed by |
|---|---|---|
| `@studioflow/config` | tsconfig base, eslint config, prettier config, tailwind preset | all apps + packages |
| `@studioflow/types` | shared base types (e.g. a sample exported type proving wiring) | web, admin |
| `@studioflow/validation` | zod-based global-validation helper + a sample schema | admin backend |
| `@studioflow/db` | Prisma client instance + schema | admin backend (server only) |
| `@studioflow/ui` | minimal shared component(s) | web, admin |
| `@studioflow/shared` | shared constants/utilities | web, admin |

## Build-time safety contract (SC-007)

- Turborepo `build`/`typecheck` tasks declare package builds as upstream dependencies.
- **Guarantee**: changing an exported type/contract in a package so a consumer no longer type-checks
  MUST cause `pnpm typecheck` / `pnpm build` (and therefore CI) to fail — the break never reaches
  runtime.

### Acceptance

- Maps to US2 scenario 5 (cross-package import resolves & type-checks) and SC-007 (deliberate
  breaking change fails CI). Verified by the quickstart "break a contract" scenario.
