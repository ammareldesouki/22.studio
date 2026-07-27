# Feature Specification: Core CMS

**Feature Branch**: `002-core-cms`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Phase 2 — Core CMS: the full content-management backend and admin
experience (Auth, Users, Roles, Media, Clients, Services, Projects, Homepage, Settings) per
`docs/implementation-plan.md` Phase 2, built on the Phase 1 foundation."

## Overview

This specification covers **Phase 2 — Core CMS** of StudioFlow: the complete content-management
system that lets a studio's own team run the entire site's content **without developer involvement**
(Constitution I, II). It delivers secure admin access with roles, a reusable Media Library, and the
core content types — Clients, Services, and Projects (case studies) — plus a section-based Homepage
composer and global Settings. Every content type shares one **Content Engine** base (status, slug,
SEO, featured, audit, versioning-ready) so the CMS is uniform and cheap to extend (Constitution III,
XVI, XVIII).

Scope is the **CMS backend/API only** — the data model, business logic, RBAC, media handling,
server-side validation, and automated tests. The **admin UI (screens, theme, components, UX) is
deferred** to a dedicated frontend feature that begins **after the theme/design is planned**; this
phase delivers the backend those screens will consume. The public visitor website is Phase 3;
global search, analytics, messages inbox, testimonials, and team are Phase 4.

## Clarifications

### Session 2026-07-27

- Q: RBAC model — fixed predefined roles, or a custom role builder? → A: **Custom role builder** —
  authorized admins create and edit roles and assign each a granular set of permissions in v1 (full
  RBAC management), enforced deny-by-default.
- Q: Does Phase 2 include the admin UI/frontend, or backend only? → A: **Backend/API only.** The
  admin UI (screens, theme, UX) is deferred to a dedicated frontend feature that starts after the
  theme/UI is planned. Phase 2 delivers the backend, data model, business logic, RBAC, validation,
  and automated tests; user-story capabilities are verified via API/backend tests, not UI.
- Q: How are concurrent edits / lost updates handled? → A: **Optimistic concurrency** using the
  `version` field — a write carrying a stale version is rejected with a conflict so the editor can
  reload and retry; no silent overwrite.
- Q: What happens when deleting a Client/Service that projects reference? → A: **Block hard-delete
  while referenced** (consistent with Media delete-protection); retire via **Archive**. References
  stay valid; archived items aren't surfaced publicly.
- Q: Slug collision policy? → A: **Auto-suffix** — a colliding slug gets `-2`, `-3`, … automatically;
  the slug stays editable and is re-validated for uniqueness on manual edit.
- Q: Permission granularity for custom roles? → A: **Per-module, per-action permissions from a fixed
  catalog** (e.g. `projects:create/edit/publish/delete`, `media:upload/delete`, `clients:manage`,
  `services:manage`, `homepage:manage`, `users:manage`, `roles:manage`, `settings:manage`); roles are
  built by selecting from the catalog (not free-form strings).

## User Scenarios & Testing *(mandatory)*

> **Scope note:** In this phase each capability below is delivered as a **backend/API operation
> verified by automated tests** — the admin UI that consumes it is a separate later feature. The
> user stories describe the capability and its behavior regardless of the eventual UI.

### User Story 1 - Secure admin access with roles (Priority: P1)

The studio owner logs into the admin app, manages who else can access it, and controls what each
person is allowed to do — so the CMS is protected and follows least privilege.

**Why this priority**: The admin app is auth-gated; every other CMS capability depends on a logged-in,
authorized user. Without access control there is no safe CMS. This is the foundation of Phase 2.

**Independent Test**: Can be fully tested by creating a user, assigning a role, logging in, and
confirming that permitted actions succeed and non-permitted actions are denied — with no content
modules required.

**Acceptance Scenarios**:

1. **Given** valid credentials, **When** a user logs in, **Then** they receive an authenticated
   session and reach the dashboard; with invalid credentials they are rejected.
2. **Given** an authenticated owner, **When** they create a user and assign a role, **Then** that
   user can log in and see only the capabilities their role permits.
3. **Given** a user whose role lacks a permission, **When** they attempt that action, **Then** it is
   denied (deny-by-default), and the attempt is not partially applied.
4. **Given** an expired session, **When** the user continues working, **Then** the session is
   refreshed transparently or the user is asked to re-authenticate; logging out invalidates the session.
5. **Given** any unauthenticated request to an admin capability, **Then** it is refused.

---

### User Story 2 - Central Media Library (Priority: P1)

An employee uploads images and videos once into a central library, organizes them (folders, tags),
finds them, and reuses the same asset across many projects — never re-uploading.

**Why this priority**: Creative studios are media-heavy and Projects **reference** media rather than
owning uploads (Constitution V). The library must exist and be usable before the project editor is
valuable, so it precedes content that depends on it.

**Independent Test**: Can be fully tested by uploading assets, organizing them into folders with
tags, searching/filtering them, and referencing one asset from two different places — confirming a
single stored asset is reused and its usage is tracked.

**Acceptance Scenarios**:

1. **Given** a valid image or video file, **When** an employee uploads it, **Then** it is stored
   once in the library with its metadata (type, dimensions, alt text) and appears in the library.
2. **Given** assets in the library, **When** the user organizes them into folders and adds tags,
   **Then** they can filter and locate assets by folder and tag.
3. **Given** an asset referenced by one or more entities, **When** the user views it, **Then** its
   usage count reflects how many entities reference it.
4. **Given** an asset with usage count greater than zero, **When** the user tries to delete it,
   **Then** deletion is blocked (delete-protection) with a clear explanation.
5. **Given** an oversized or unsupported file, **When** upload is attempted, **Then** it is rejected
   with a clear reason and nothing is stored.

---

### User Story 3 - Manage Projects as case studies (Priority: P1)

The owner or an employee creates and edits a Project as a rich case study — title, overview,
gallery/video media, challenge/solution/results, related projects, SEO — and moves it through a
publish lifecycle. Every field except the title is optional.

**Why this priority**: Projects are the primary product value — the work a studio showcases
(Constitution VI). They are the largest and most-used content type and the reason the platform
exists.

**Independent Test**: Can be fully tested by creating a project with only a title, then enriching it
with media references and case-study sections, and moving it Draft → Published → Archived — confirming
each state behaves correctly and only the title is required.

**Acceptance Scenarios**:

1. **Given** the project editor, **When** a project is created with only a title, **Then** it saves
   successfully as a Draft (all other fields optional).
2. **Given** a project, **When** the editor attaches existing library media and fills case-study
   sections (overview, gallery, challenge/solution/results, related projects, SEO), **Then** the
   project stores those references without duplicating the media.
3. **Given** a Draft project, **When** it is published, **Then** its state becomes Published and its
   first-publish timestamp is recorded; it can later be archived and restored.
4. **Given** a project, **When** a slug is generated or edited, **Then** the slug is unique among
   projects and usable as a stable identifier.
5. **Given** an attempt to save a project without a title, **Then** it is rejected with a clear
   validation message.

---

### User Story 4 - Clients & Services catalog (Priority: P2)

The owner maintains the studio's Clients and the Services it offers (with optional sub-services), so
Projects can be attributed to a client and tagged with the services delivered.

**Why this priority**: Clients and Services enrich Projects and power filtering, but a Project is
still valid without them (all references optional). They therefore follow Projects in priority while
remaining prerequisites for a fully attributed case study.

**Independent Test**: Can be fully tested by creating clients and services (with a sub-service),
ordering them, and referencing them from a project — confirming the references resolve and ordering
is respected.

**Acceptance Scenarios**:

1. **Given** the admin, **When** the owner creates a Client (name, logo, website) and a Service
   (name, description, optional sub-service), **Then** both are saved and listable in a defined order.
2. **Given** existing clients and services, **When** a project references a client and one or more
   services, **Then** those references are stored and displayed on the project.
3. **Given** a client or service referenced by projects, **When** it is edited, **Then** the change
   is reflected wherever it is referenced.
4. **Given** a service, **When** the owner reorders services, **Then** the new order is persisted.

---

### User Story 5 - Compose the homepage from sections (Priority: P2)

The owner assembles the public homepage from a fixed catalog of predefined sections (Hero, Services,
Projects, Clients, Stats, Testimonials, FAQ, CTA) — enabling, disabling, reordering, and configuring
each — without ever editing raw HTML.

**Why this priority**: The homepage is the studio's front door and must be owner-editable (Constitution
IV, "structured flexibility"), but it depends on the underlying content (projects, services, clients)
existing first, so it follows the core content types.

**Independent Test**: Can be fully tested by enabling/disabling sections, reordering them, and
configuring a section's content — confirming the composed homepage definition reflects the choices,
with no raw-HTML editing available.

**Acceptance Scenarios**:

1. **Given** the homepage composer, **When** the owner enables, disables, and reorders sections,
   **Then** the homepage definition stores the enabled set and their order.
2. **Given** a section that surfaces content (e.g., Featured Projects), **When** the owner configures
   which items it shows, **Then** the configuration is stored per section.
3. **Given** the composer, **When** the owner looks for a raw-HTML editor, **Then** none exists —
   only bounded, predefined section configuration.

---

### User Story 6 - Global site settings (Priority: P2)

The owner manages global, site-wide settings — site name, logo, social links, default SEO, analytics
identifiers, and contact details — in one place, without code changes.

**Why this priority**: Settings are global and infrequently changed; they support the site but are
not the daily content work, so they follow the core content modules.

**Independent Test**: Can be fully tested by editing each settings field and confirming the single
settings record persists and returns the updated values.

**Acceptance Scenarios**:

1. **Given** the settings screen, **When** the owner updates site name, logo, social links, SEO
   defaults, analytics IDs, and contact details, **Then** all values persist as a single site
   configuration.
2. **Given** existing settings, **When** they are read, **Then** the current values are returned.

### Edge Cases

- What happens when two editors edit the same project or the same settings record concurrently — is
  a lost update prevented or surfaced?
- What happens when a referenced entity is removed or archived (e.g., a service a project points to)
  — does the project remain valid and the dangling reference handled gracefully?
- What happens when an asset is referenced, then the referencing entity is deleted — is the usage
  count decremented so the asset becomes deletable again?
- What happens when a slug collision would occur — is a unique slug enforced or auto-suffixed?
- What happens when a role is changed or removed while a user with that role is active — do their
  permissions update on the next action?
- What happens when an upload begins but fails midway (network/storage error) — is a partial/orphan
  asset avoided?
- What happens when unpublishing or archiving content — does it correctly leave the published surface?

## Requirements *(mandatory)*

### Functional Requirements

**Content Engine (shared base — cross-cutting)**

- **FR-001**: Every content type (Project, Service, Client, HomepageSection, Testimonial, Page) MUST
  share one base providing: publication status (Draft/Published/Archived), a unique slug per type,
  a `featured` flag, embedded SEO metadata, audit fields (created-by/updated-by, timestamps,
  first-published time), a localization-ready locale, and a version counter used for optimistic
  concurrency (see FR-025).
- **FR-002**: The system MUST enforce the lifecycle Draft → Published → Archived (with unpublish and
  restore transitions) uniformly across all content types; the first-publish time MUST be stamped once.
- **FR-003**: Slugs MUST be unique within a content type and MUST be generatable from the title and
  editable. On collision a numeric suffix (`-2`, `-3`, …) MUST be applied automatically; manual slug
  edits MUST be re-validated for uniqueness.

**Authentication, Users & Roles (RBAC)**

- **FR-004**: The system MUST authenticate admin users with a login that establishes a session and a
  logout that invalidates it; expired sessions MUST be refreshable or force re-authentication.
- **FR-005**: An authorized user MUST be able to create, edit, deactivate, and list admin users and
  assign each a role.
- **FR-006**: The system MUST let authorized admins **create and edit custom roles**, each mapping to
  a granular set of permissions drawn from a **fixed, per-module, per-action catalog** (e.g.
  `projects:create/edit/publish/delete`, `media:upload/delete`, `clients:manage`, `services:manage`,
  `homepage:manage`, `users:manage`, `roles:manage`, `settings:manage`), and MUST enforce those
  permissions on every admin action with **deny-by-default** (least privilege); passwords MUST be
  stored hashed. At least one role with full access (owner-level) MUST always exist and MUST NOT be
  left unassigned.
- **FR-007**: Every admin capability MUST be inaccessible to unauthenticated requests.

**Media Library**

- **FR-008**: Users MUST be able to upload image and video assets into a central Media Library that
  stores each asset once with metadata (type, dimensions, alt text, folder, tags).
- **FR-009**: Media MUST be organizable into folders and taggable, and the library MUST be
  filterable/locatable by folder and tag.
- **FR-010**: Media MUST be referenced by id from other entities (never re-uploaded), and each
  asset MUST track a usage count reflecting how many entities reference it.
- **FR-011**: Deleting an asset with usage count greater than zero MUST be blocked (delete-protection).
- **FR-012**: Uploads MUST be validated for type and size and rejected with a clear reason when
  invalid, leaving no partial/orphan asset.

**Clients & Services**

- **FR-013**: Users MUST be able to create, edit, list, and order Clients (name, logo reference,
  website).
- **FR-014**: Users MUST be able to create, edit, list, and order Services, each with optional
  Sub-Services.
- **FR-015**: A Project MUST be able to reference one Client and multiple Services (and optional
  sub-services); edits to a client/service MUST reflect wherever referenced. A Client or Service that
  is referenced by any project MUST NOT be hard-deleted (consistent with Media delete-protection,
  FR-011); it is retired by **Archiving** it, which keeps existing references valid.

**Projects (case studies)**

- **FR-016**: Users MUST be able to create and edit Projects with a required title and all other
  fields optional: overview, description, gallery media, video media, before/after media, challenge,
  solution, results, external links, client reference, service references, related projects, and SEO.
- **FR-017**: Projects MUST reference media from the library (by id) for galleries/videos/before-after
  without duplicating assets.
- **FR-018**: Projects MUST support the shared publish lifecycle and per-project SEO metadata.

**Homepage & Settings**

- **FR-019**: The owner MUST be able to compose the homepage from a fixed catalog of predefined
  sections by enabling, disabling, reordering, and configuring each section; raw-HTML editing MUST
  NOT be possible.
- **FR-020**: The system MUST persist a single global Settings record (site name, logo, social links,
  SEO defaults, analytics IDs, contact details) that is editable and readable.

**Cross-cutting behavior**

- **FR-021**: All content editable here MUST be manageable without any source-code change or redeploy
  (Constitution I, III).
- **FR-022**: The backend MUST validate all incoming input and MUST NOT trust client-side validation;
  invalid input MUST be rejected with a consistent, informative error.
- **FR-023**: List endpoints MUST be paginated so the CMS remains responsive as content grows.
- **FR-024**: Each domain module (auth, users, roles, media, clients, services, projects, homepage,
  settings) MUST remain isolated with clear responsibilities and MUST NOT become mutually dependent
  (Constitution VIII).
- **FR-025**: Writes to editable records MUST use **optimistic concurrency**: a write carrying a
  stale `version` MUST be rejected with a conflict (no silent lost update), so the editor can reload
  the current state and retry.

### Key Entities *(include if feature involves data)*

- **User**: an admin user — name, email, password hash, role reference, active flag.
- **Role**: a named, **admin-managed** set of granular permissions (custom roles) selected from a
  fixed per-module/per-action permission catalog, enforcing least privilege. At least one full-access
  (owner-level) role always exists.
- **Media**: a reusable asset in the central library — type (image/video/before-after/YouTube/Vimeo/
  AI/Lottie), storage reference + public URL, dimensions, alt text, folder, tags, usage count,
  delete-protection.
- **Folder**: hierarchical organizer for Media (name, parent).
- **Client**: an organization the studio worked for — name, logo (media ref), website, order. Has
  many Projects. Extends the Content Engine base.
- **Service**: a capability offered — name, description, icon/media, order; may have many
  **SubService** children. Referenced by Projects. Extends the base.
- **Project**: the richest content type (case study) — title (required) plus optional overview,
  description, gallery/videos/before-after (media refs), challenge, solution, results, external links,
  client ref, service refs, related projects (self-refs), SEO. Extends the base.
- **HomepageSection**: a configurable homepage block (Hero, Services, Projects, Clients, Stats,
  Testimonials, FAQ, CTA) — type, enabled, order, typed config. Extends the base.
- **Settings**: a singleton site configuration — site name, logo (media ref), social links, SEO
  defaults, analytics IDs, contact details.

*(Testimonial and Page also extend the Content Engine base but their editor UIs are exercised in
Phase 4 / Phase 3 respectively; the base is defined here.)*

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An editor can go from login to a **published project** that references library media,
  a client, and a service in **under 10 minutes** using only the admin app — no developer involvement.
- **SC-002**: **100%** of the content types in scope (projects, clients, services, homepage sections,
  settings) are fully editable through the admin app with **zero** source-code changes or redeploys.
- **SC-003**: For a user whose role lacks a permission, the corresponding action is **denied in 100%**
  of attempts (deny-by-default), and no partial change is applied.
- **SC-004**: A single uploaded asset can be referenced by **multiple** projects with **no**
  re-upload, and attempting to delete an in-use asset is **blocked 100%** of the time.
- **SC-005**: Every content type supports Draft → Published → Archived transitions, and the correct
  state is reflected in **100%** of transition attempts.
- **SC-006**: The homepage can be recomposed (enable/disable/reorder/configure sections) entirely
  through bounded configuration, with **no** raw-HTML editing path available.
- **SC-007**: **100%** of admin write operations reject invalid input via server-side validation
  (proven by tests submitting malformed and unauthorized requests).
- **SC-008**: Content list views remain responsive (paginated) with at least **1,000** items in a
  list without degradation in the admin experience.

## Assumptions

- **Built on the Phase 1 foundation** (`001-foundation-discovery`, complete): the monorepo, the two
  Next.js apps with the backend built in (no separate API), Supabase Postgres + Prisma, Cloudflare R2
  media storage, the global validation layer, and CI are already in place and are binding constraints.
- **The architecture and stack are established, not re-litigated here**: layered backend (route
  handler / server action → service → repository), JWT + refresh + RBAC for auth, the Content Engine
  base, and Supabase/R2 as recorded in `docs/technical-architecture.md`. Requirements stay
  outcome-focused; the stack is recorded as an established constraint.
- **Single studio, single locale in v1**: content is single-tenant with no `studioId` and a single
  active locale (localization-ready fields reserved but not exercised).
- **Admin-only scope**: this feature delivers the CMS backend + admin UI. The public website that
  renders this content is Phase 3; global search, analytics, messages, testimonials UI, and team are
  Phase 4.
- **Media delivery** uses Cloudflare R2 for storage (free egress) with Cloudflare image transforms;
  heavy video is referenced via YouTube/Vimeo. Actual on-the-fly transform tuning is a Phase 5 concern.
- **Performance/accessibility/SEO budgets** for the public site are deferred to Phases 3 and 5; this
  feature must be correct, validated, and paginated, not yet performance-optimized.

## Dependencies

- **Phase 1 foundation** (`specs/001-foundation-discovery`) — workspace, data layer, validation, CI.
- **Governing constitution** (`.specify/memory/constitution.md` v1.0.0) and the Phase 0 discovery
  docs under `docs/` (domain model, user flows, technical architecture).
- **External services**: Supabase Postgres (app + migrations) and Cloudflare R2 (media), supplied via
  environment configuration.

## Out of Scope

- The **admin UI / frontend** (screens, theme, components, UX) — deferred to a dedicated frontend
  feature that begins **after UI/theme planning**; Phase 2 delivers only the backend it will consume.
- The **public visitor website** and any rendering of this content for visitors — Phase 3.
- **Global search**, analytics dashboards, the **messages inbox**, testimonials admin UI, and team
  management — Phase 4.
- Performance/SEO/accessibility **CI budgets** and scale hardening (~20k projects) — Phase 5.
- Multi-studio/multi-tenant, billing, public API, blog, client portal, approval workflows, quote
  requests, collections — Phase 6.
