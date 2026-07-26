# Feature Specification: Foundation & Product Discovery

**Feature Branch**: `001-foundation-discovery`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "read phase zero and one from docs/implementation-plan.md and, per GitHub Spec Kit best practices, create a spec"

## Overview

This specification covers **Phase 0 (Product Discovery)** and **Phase 1 (Foundation)** of the
StudioFlow platform. Together these phases produce (a) a ratified, internally consistent set of
discovery artifacts that everyone building the platform can rely on, and (b) a buildable,
testable project skeleton with zero business logic on which every later feature is built.

The value delivered is **de-risking**: before any feature is written, the team shares one
agreed-upon understanding of the product and the domain, and can prove — automatically, on a
clean checkout — that the whole workspace installs, type-checks, lints, builds, migrates the
database, boots each application, and passes its tests. No visitor-facing or content-management
feature is in scope here; those begin in Phase 2.

## Clarifications

### Session 2026-07-26

- Q: Should the health-check route verify the database connection, or only prove the process is up? → A: Liveness only — returns 200 if the app backend process is up and serving; it does not touch the database (data-layer verification is covered independently by the CI migration check).
- Decision: Hosting/cost posture — target **free hosting** ($0/month + ~$10/year domain) for a single-studio v1; **fold the backend into the Next.js apps** (route handlers / server actions) instead of a separate `apps/api` NestJS server. Documented, reversible deviation from Constitution VIII; see `docs/technical-architecture.md`.
- Q: For media/asset delivery in Phase 1, must CI make a live authenticated call to the media provider, or is config wiring without a live call sufficient? → A: Config-wired only — the media client is initialized from env config and asserted present/valid; CI makes no live network call to the provider (no feature uses media yet).
- Q: What does the baseline migration create, given zero business logic and no content models until Phase 2? → A: Empty baseline — establishes the migration tooling/history and any DB-level prerequisites (e.g., extensions), but creates no domain tables.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shared, ratified product understanding (Priority: P1)

A product owner and the engineering team need one authoritative, mutually consistent set of
discovery documents — governing principles, product vision, personas, user flows, domain model,
and a phased plan — so that every subsequent decision traces back to an agreed source of truth
rather than to individual assumptions.

**Why this priority**: Every later phase declares a dependency on Phase 0. Without agreed
discovery artifacts, features are built on divergent mental models, which is the fastest route to
rework. This is the foundation of the foundation.

**Independent Test**: Can be fully tested by reviewing the discovery documents against the
governing principles and against each other — confirming no principle is unaddressed, no domain
entity is orphaned, and every stated failure mode has a mitigating decision — without any code
existing.

**Acceptance Scenarios**:

1. **Given** the set of discovery documents, **When** a reviewer maps each governing principle to
   the phase(s) that exercise it, **Then** every principle is exercised by at least one phase.
2. **Given** the domain model, **When** a reviewer traces relationships, **Then** no entity is
   orphaned (every entity is referenced by, or references, at least one other entity or flow).
3. **Given** the stated Definitions of Failure, **When** a reviewer checks the mitigation map,
   **Then** each failure mode has at least one mitigating decision assigned to a specific phase.
4. **Given** any two discovery documents, **When** a reviewer compares overlapping claims,
   **Then** they are internally consistent (no contradictory statements).

---

### User Story 2 - Buildable, CI-verified workspace skeleton (Priority: P1)

A developer joining the project needs to clone the repository, run one install and one build, and
have the entire multi-application workspace type-check, lint, build, and pass its tests — so that
the team has a trustworthy, automated baseline before feature work begins.

**Why this priority**: A green, reproducible build on a clean checkout is the exit criterion of
Phase 1 and the precondition for all feature phases. If the skeleton is not automatically
verifiable, every later "it works on my machine" failure compounds.

**Independent Test**: Can be fully tested by performing a clean checkout in a fresh environment,
running the install and the build/test commands, and confirming the continuous-integration
pipeline reports success across all applications and shared packages.

**Acceptance Scenarios**:

1. **Given** a clean checkout with no prior local state, **When** dependencies are installed and
   the workspace is built, **Then** the build completes successfully for every application and
   shared package.
2. **Given** the workspace, **When** the type-check and lint commands run, **Then** both pass for
   every application and shared package with no errors.
3. **Given** the workspace, **When** the test command runs, **Then** all tests pass.
4. **Given** a pull request, **When** the CI pipeline runs, **Then** install, type-check, lint,
   build, and test all report success and the pipeline is green.
5. **Given** a shared package that exposes types or validation contracts, **When** an application
   imports from it, **Then** the import resolves and type-checks (proving cross-package wiring).

---

### User Story 3 - Verifiable data layer baseline (Priority: P2)

A developer needs the database provisioned and a baseline schema migration that can be applied
against a disposable test database, so that the persistence layer is proven to connect and evolve
before any content model is added.

**Why this priority**: The data layer underpins every content module in later phases. Proving
migrations run cleanly against a throwaway database now prevents foundational persistence problems
from surfacing mid-feature. It depends on the skeleton (US2) existing.

**Independent Test**: Can be fully tested by pointing the migration tooling at a throwaway
database, running the baseline migration, and confirming it completes and the connection is
established — with no application feature required.

**Acceptance Scenarios**:

1. **Given** a throwaway test database, **When** the baseline migration is applied, **Then** it
   completes successfully and leaves the schema in the expected baseline state.
2. **Given** valid connection settings, **When** the data layer initializes, **Then** it connects
   to the database without error.
3. **Given** the CI pipeline, **When** it runs, **Then** the migration is executed against a
   throwaway database as part of the verification, not only on a developer's machine.

---

### User Story 4 - Each application boots with a health signal (Priority: P2)

An operator or developer needs each application to boot locally and the backend to expose a
health-check route that returns a healthy status, so that basic runtime viability is
confirmable before any feature endpoints exist.

**Why this priority**: A bootable app and a health signal are the minimum runtime proof that the
skeleton is not just compilable but runnable, and give CI and future monitoring a stable probe.
It depends on the skeleton (US2).

**Independent Test**: Can be fully tested by starting each application locally and issuing a
request to the API health-check endpoint, confirming a healthy (2xx) response — with no business
functionality present.

**Acceptance Scenarios**:

1. **Given** the public web application, **When** it is started locally, **Then** it boots and
   serves its default page without error.
2. **Given** the admin application, **When** it is started locally, **Then** it boots and serves
   its default page without error.
3. **Given** the administration app, **When** a request is made to its health-check route,
   **Then** it responds with a healthy status (HTTP 200).
4. **Given** any input submitted to a backend route, **When** it is received, **Then** it passes
   through a global validation layer (proving the backend does not trust unvalidated input, even
   before feature endpoints exist).

### Edge Cases

- What happens when a shared package changes its exported contract — does every dependent
  application fail the type-check (surfacing the break at build time rather than at runtime)?
- How does the workspace behave on a checkout with a partial or corrupted dependency cache — does
  a clean install still produce a green build?
- What happens when the baseline migration is run twice against the same database — does the
  tooling report the schema as already up to date rather than erroring or duplicating?
- How does CI behave when the throwaway test database is unavailable — is the failure clear and
  attributable to the database step rather than a generic build failure?
- What happens when a discovery document is updated but a dependent document is not — does the
  consistency review catch the divergence?

## Requirements *(mandatory)*

### Functional Requirements

**Product Discovery (Phase 0)**

- **FR-001**: The project MUST maintain a ratified set of discovery artifacts covering, at
  minimum: governing principles, product vision, personas, user flows, domain model, and a phased
  implementation plan.
- **FR-002**: Every governing principle MUST be traceable to at least one phase that exercises it.
- **FR-003**: The domain model MUST contain no orphan entities; every entity MUST participate in
  at least one relationship or flow.
- **FR-004**: Every stated Definition of Failure MUST map to at least one mitigating decision
  assigned to a specific phase.
- **FR-005**: The discovery artifacts MUST be internally consistent, with no contradictory claims
  across documents.

**Foundation — workspace & build (Phase 1)**

- **FR-006**: The system MUST be organized as a single workspace containing the two planned
  applications (public site, administration app) — each a Next.js app with its backend built in
  (route handlers / server actions), with no separate API server — and the planned set of shared
  packages.
- **FR-007**: The system MUST provide a single-command install and a single-command build that
  operate across every application and shared package.
- **FR-008**: The system MUST provide workspace-wide type-checking, linting, and testing commands
  that cover every application and shared package.
- **FR-009**: Shared configuration (linting, formatting, type-check settings, styling presets)
  MUST be defined once and reused by all applications and packages.
- **FR-010**: Shared types and validation contracts MUST be consumable by the applications, and a
  break in a shared contract MUST surface as a build/type-check failure in dependents.
- **FR-011**: A continuous-integration pipeline MUST run install, type-check, lint, build, and
  test on every change and MUST report a single pass/fail result.
- **FR-012**: `pnpm build` and `pnpm test` (the workspace build and test commands) MUST pass on a
  clean checkout with no pre-existing local state.

**Foundation — data layer (Phase 1)**

- **FR-013**: A relational database MUST be provisioned and the data layer MUST establish a
  connection using externally supplied configuration (no secrets in source).
- **FR-014**: A baseline schema migration MUST exist and MUST apply successfully against a
  throwaway/test database. The baseline establishes the migration tooling and its history plus any
  DB-level prerequisites (e.g., extensions); it MUST NOT create any domain tables (honoring the
  zero-business-logic constraint in FR-020).
- **FR-015**: The migration step MUST be exercised by CI against a throwaway database, not only
  locally.

**Foundation — runtime & configuration (Phase 1)**

- **FR-016**: Each application MUST boot locally without error.
- **FR-017**: The application backend MUST expose a health-check route (a Next.js route handler)
  that returns HTTP 200 when the app process is up and serving. This is a liveness probe only: it
  MUST NOT depend on the database connection (data-layer verification is covered by FR-015's CI
  migration check).
- **FR-018**: The backend MUST apply a global input-validation layer to incoming requests from the
  outset, establishing that it never trusts unvalidated input.
- **FR-019**: Media/asset delivery and environment configuration MUST be wired (connectable and
  configurable) at the infrastructure level, without any content feature depending on it yet. The
  media client MUST be initialized from environment configuration and its configuration asserted
  present/valid; CI MUST NOT make a live network call to the media provider (no feature consumes
  media in this phase, so live provider credentials are not a CI dependency).
- **FR-020**: This foundation MUST contain zero business logic; no content-management or
  visitor-facing feature behavior is introduced in these phases.

### Key Entities *(include if feature involves data)*

- **Discovery Artifact**: A discovery document (e.g., governing principles, product vision,
  personas, user flows, domain model, implementation plan). Attributes: purpose, the principles it
  addresses, and its consistency relationships to other artifacts.
- **Workspace**: The overall project container. Comprises the applications and shared packages and
  defines the shared configuration, build, and verification commands.
- **Application**: A deployable unit within the workspace (public site, administration app). Each
  is a Next.js app with its backend built in. Attributes: boot status, and a health signal (exposed
  by the backend).
- **Shared Package**: A reusable internal library (e.g., UI components, shared utilities, types,
  validation, configuration) consumed by applications and other packages.
- **Baseline Migration**: The initial schema-evolution unit applied to the database to establish
  the baseline state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can trace 100% of governing principles to at least one phase, and 100% of
  stated failure modes to at least one mitigating decision, with zero unaddressed items.
- **SC-002**: The domain model has zero orphan entities.
- **SC-003**: On a clean checkout in a fresh environment, a new developer can go from clone to a
  fully green build and test run in under 15 minutes using only the documented single install and
  build/test commands.
- **SC-004**: The CI pipeline reports install, type-check, lint, build, and test as passing for
  100% of the applications and shared packages on every change.
- **SC-005**: The baseline migration applies successfully against a throwaway database in 100% of
  CI runs.
- **SC-006**: Both applications boot locally, and the backend health-check route returns a
  healthy status on 100% of attempts.
- **SC-007**: A deliberately introduced breaking change to a shared contract is caught by the
  build/type-check (fails CI) rather than reaching runtime — demonstrating cross-package safety.
- **SC-008**: Zero business-logic or feature behavior is present in the foundation (verified by
  review: only skeleton, configuration, health-check, and baseline migration exist).

## Assumptions

- **Phase 0 is largely complete**: The governing principles document is already ratified
  (v1.0.0), and the companion discovery documents (vision, personas, user flows, domain model,
  implementation plan) exist under `docs/`. This spec treats Phase 0's remaining work as review
  and consistency verification, not authoring from scratch.
- **The architecture is decided and is a binding constraint for v1** (a single-studio, free-hosted
  build). The technology and structural choices: monorepo with pnpm workspaces + Turborepo;
  **two Next.js 15 (App Router) apps — `apps/web` (public) and `apps/admin` (CMS)** — each with its
  backend built in via route handlers / server actions (**no separate `apps/api` server**); shared
  `db`, `types`, `validation`, `ui`, `shared`, `config` packages; PostgreSQL + Prisma on a free tier
  (Supabase); Cloudflare R2 (free egress) for media; JWT + refresh tokens + RBAC for auth;
  hosting on free tiers (Vercel Hobby / Cloudflare Pages) targeting **$0/month + ~$10/year domain**.
  These are recorded as established constraints so requirements stay outcome-focused. Folding the
  backend into Next.js is a **documented, reversible deviation from Constitution VIII** (a separate
  API can be extracted later for SaaS) — see `docs/technical-architecture.md` §3.
- **Scope is strictly infrastructure and discovery**. Authentication behavior, content modules,
  the admin UI, and the public site are explicitly out of scope for these two phases and begin in
  Phase 2 onward.
- **Standard developer environment**: contributors have the required runtime and package-manager
  tooling and network access to install dependencies and reach a database and media provider.
- **"Throwaway database" means a disposable database instance** created for verification and
  discarded afterward, used so migrations can be proven without touching any shared or production
  data.
- **Performance, accessibility, SEO, and scale budgets are deferred** to their dedicated later
  phases (Phases 3 and 5); the foundation only needs to be correct and verifiable, not optimized.

## Dependencies

- **Governing principles / constitution** (`.specify/memory/constitution.md`, v1.0.0) — the source
  of truth all discovery artifacts and foundation decisions must satisfy.
- **Companion discovery documents** under `docs/` — `product-vision.md`, `personas.md`,
  `user-flows.md`, `domain-model.md`, `technical-architecture.md`, `implementation-plan.md`.
- **External services** required for wiring (not feature use) in Phase 1: a PostgreSQL database
  instance (Supabase free tier) and a Cloudflare R2 bucket + API token (free tier),
  supplied via environment configuration. Hosting targets free tiers (Vercel Hobby / Cloudflare
  Pages) — $0/month plus a ~$10/year custom domain.
- **A CI environment** capable of running install, type-check, lint, build, test, and a throwaway
  database for the migration check.

## Out of Scope

- Any content-management feature (Auth behavior, Users, Roles, Media Library, Clients, Services,
  Projects, Homepage Builder, Settings) — begins in Phase 2.
- Any visitor-facing page or rendering from CMS data — begins in Phase 3.
- Advanced CMS modules and global search — Phase 4.
- Performance, SEO, and accessibility enforcement as CI budgets — Phase 5.
- Roadmap/future modules (quote requests, collections, blog, client portal, multi-tenancy, etc.) —
  Phase 6.
