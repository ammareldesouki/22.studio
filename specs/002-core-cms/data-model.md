# Phase 1 Data Model: Core CMS

The persisted schema for the CMS backend (Supabase Postgres via Prisma). Canonical domain reference:
[`docs/domain-model.md`](../../docs/domain-model.md). All content types embed the **Content Engine
base**. Single-tenant v1 (no `studioId`; additive later).

## Content Engine base (embedded on every content type)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid (pk) | |
| `status` | enum `DRAFT`\|`PUBLISHED`\|`ARCHIVED` | default `DRAFT` |
| `slug` | string | **unique per type** (DB unique index); auto-suffix on collision |
| `featured` | boolean | default false |
| `seo` | embedded (see SEO) | title, metaDescription, canonicalUrl, ogImage(mediaId), twitterCard, structuredData(json), robots |
| `createdBy` / `updatedBy` | uuid → User | audit |
| `createdAt` / `updatedAt` | timestamptz | |
| `publishedAt` | timestamptz? | stamped once on first publish |
| `locale` | string | single active locale in v1 |
| `version` | int | optimistic concurrency; incremented per update (FR-025) |

**Applies to:** `Project`, `Service`, `Client`, `HomepageSection`, `Testimonial`, `Page`.
(Testimonial/Page defined for the base but their admin flows are Phase 4/3.)

**Status transitions:** `DRAFT →publish→ PUBLISHED →archive→ ARCHIVED`; `PUBLISHED →unpublish→
DRAFT`; `ARCHIVED →restore→ DRAFT`. `publishedAt` set on first `PUBLISHED`.

## Operational entities

### User
`id`, `name`, `email` (unique), `passwordHash` (argon2), `roleId` → Role, `active` (bool),
timestamps. **Validation**: valid email; password meets strength policy (min length) at set-time.

### Role
`id`, `name` (unique), `permissions` (string[] from the fixed catalog), `isOwner` (bool — the
immutable full-access role), timestamps. **Rules**: at least one `isOwner` role always exists;
permissions ⊆ catalog; a user's role cannot be deleted while assigned (reassign first).

**Permission catalog** (fixed, in `packages/types`): `projects:create|edit|publish|delete`,
`media:upload|delete`, `clients:manage`, `services:manage`, `homepage:manage`, `users:manage`,
`roles:manage`, `settings:manage`.

### Media
`id`, `type` enum (`IMAGE|VIDEO|BEFORE_AFTER|YOUTUBE|VIMEO|AI|LOTTIE`), `r2Key`, `url`,
`width?`, `height?`, `alt?`, `folderId?` → Folder, `tags` (string[]), `usageCount` (int, default 0),
timestamps. **Rules**: not a Content type (no lifecycle). **Delete-protection**: cannot delete when
`usageCount > 0`. Upload validated for type/size (images ≤10MB; video ≤100MB) — see research §7.

### Folder
`id`, `name`, `parentId?` → Folder (self-ref, hierarchical), timestamps.

### Settings (singleton)
`id` (single row), `siteName`, `logoId?` → Media, `socialLinks` (json), `seoDefaults` (embedded SEO),
`analyticsIds` (json), `contact` (json), `version`, timestamps.

## Content types

### Client *(extends base)*
+ `name`, `logoId?` → Media, `website?`, `order` (int). **Has many** Projects.

### Service *(extends base)*
+ `name`, `description?`, `iconMediaId?` → Media, `order` (int). **Has many** SubService.

### SubService
`id`, `name`, `description?`, `serviceId` → Service, `order`. (Child of Service; not a full content
type.)

### Project *(extends base — richest)*
+ `title` (**required**), `overview?`, `description?`, `challenge?`, `solution?`, `results?`,
`externalLinks` (json[]), `clientId?` → Client. All non-title fields optional (VI).
Relations: `services` (m:n → Service via `ProjectService`), `subServices` (m:n → SubService),
`media` (m:n → Media via `ProjectMedia` with a `type` = gallery|video|before_after + `order`),
`relatedProjects` (m:n self-ref via `RelatedProject`).

### HomepageSection *(extends base)*
+ `type` enum (`HERO|SERVICES|PROJECTS|CLIENTS|STATS|TESTIMONIALS|FAQ|CTA`), `enabled` (bool),
`order` (int), `config` (json, typed per section type). **Rule**: no raw HTML — config is bounded
per type (FR-019).

## Join tables

- **ProjectService** (`projectId`, `serviceId`) — m:n.
- **ProjectMedia** (`projectId`, `mediaId`, `type` gallery|video|before_after, `order`) — m:n typed.
- **RelatedProject** (`projectId`, `relatedProjectId`) — m:n self-ref.

## Relationships (summary)

```text
Role 1───* User ──(createdBy/updatedBy on all content)
Client 1───* Project *───* Service 1───* SubService
                  │  \───* Media (via ProjectMedia: gallery/video/before_after)
                  └───* Project (RelatedProject, self)
Folder 1───* Media *  (referenced by Project, Client, Service, HomepageSection, Settings — never owned)
HomepageSection *  (ordered/enabled; config references content by id)
Settings 1 (singleton) → Media (logo)
```

## Cross-cutting rules

- **Media usageCount semantics**: `usageCount` counts **ProjectMedia rows** (a media used in one
  project under both `GALLERY` and `BEFORE_AFTER` counts as 2). The transactional adjuster
  increments/decrements per reference row; removing a project must decrement every row it added.
  `usageCount` is floored at 0 (never negative) so delete-protection stays correct.
- **Referential integrity (DB-level, add in US4 migration)**: referenced relations
  (`Project.client`, `*.logo/iconMedia`, `ProjectMedia.media`, `ProjectService.service`) get
  explicit `onDelete: Restrict` to back the service-level block-while-referenced; join-row parents
  (`ProjectMedia.project`, `ProjectService.project`, `RelatedProject.*`) get `onDelete: Cascade`.
  Until then the service layer is the enforcement point.
- **Optimistic concurrency**: writes to any versioned record use a **conditional update**
  (`updateMany WHERE id + version`, `version: { increment: 1 }`); a 0-row result → 409 (FR-025).
  A read-then-compare is racy and MUST NOT be used.
- **Referential integrity**: referenced Client/Service → archive not hard-delete; Media
  `usageCount>0` → delete blocked; `usageCount` maintained transactionally on reference add/remove.
- **Uniqueness**: `slug` unique per content type; `User.email` unique; `Role.name` unique.
- **Pagination**: keyset (`createdAt,id`) on all list queries; indexes on `slug,status,publishedAt,
  featured` + FKs.

## Deferred (later phases)

- Testimonial / Page **admin flows** (base defined here) — Phase 4 / Phase 3.
- Global full-text search across entities — Phase 4.
- `studioId` multi-tenant scoping — Phase 6 (additive).
