# StudioFlow — Domain Model

> Phase 0 · Product Discovery
> The canonical entities, relationships, and the Content Engine abstraction. This is the contract
> the Prisma schema and API modules implement in later phases. Related:
> [`implementation-plan.md`](./implementation-plan.md), [`user-flows.md`](./user-flows.md).

---

## The Content Engine (base abstraction)

Everything a studio manages is **content**. Rather than modelling Project, Service, Client, etc.
as unrelated tables, every content type extends one shared base. This is the single most important
decision for CMS maintainability and extensibility (Constitution I, III, XVI, XVIII).

**Content base fields (shared by every content type):**

| Field | Purpose |
|---|---|
| `id` | Primary key |
| `status` | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `slug` | Unique URL slug (per type) |
| `featured` | Boolean flag for surfacing on homepage/listings |
| `seo` | Embedded SEO metadata (see below) |
| `createdBy` / `updatedBy` | User references (audit) |
| `createdAt` / `updatedAt` / `publishedAt` | Timestamps |
| `locale` | Localisation-ready (single locale in v1) |
| `version` | Versioning-ready counter (history deferred, field reserved) |

**Content types that extend the base:** `Project`, `Service`, `Client`, `HomepageSection`,
`Testimonial`, `Page` (About/Contact static content). Non-content operational entities
(`User`, `Role`, `Media`, `Message`, `Settings`) do **not** extend it but may reference it.

**SEO value object (embedded on every content type):**
`title`, `metaDescription`, `canonicalUrl`, `ogImage` (Media ref), `twitterCard`,
`structuredData` (JSON-LD), plus `robots` directives. Sitemap entries are derived from published
content (Constitution XI).

---

## Entities

### Content types

- **Project** — the richest entity; a case study. Fields (all optional except `title`): overview,
  description, gallery (Media refs), videos (Media refs), before/after (Media pairs), challenge,
  solution, results, external links, `client` (ref), `services` (refs), optional `subServices`
  (refs), `relatedProjects` (self-refs). Extends Content base.
- **Client** — an organisation the studio worked for: name, logo (Media ref), website, order.
  Extends Content base. Has many Projects.
- **Service** — a capability the studio offers: name, description, icon/media, order. Extends
  Content base. May have many **SubServices**. Referenced by Projects.
- **SubService** — optional child of a Service: name, description, parent `service` (ref).
- **HomepageSection** — a configurable homepage block (Hero, Services, Projects, Clients, Stats,
  Testimonials, FAQ, CTA): `type`, `enabled`, `order`, `config` (typed per section), appearance
  settings. Extends Content base. Admins compose the homepage from these (Constitution IV).
- **Testimonial** — quote, author, role, client (ref), avatar (Media ref). Extends Content base.
- **Page** — static-ish pages (About, Contact): structured content blocks + SEO. Extends base.

### Media & operational entities

- **Media** — a reusable asset in the central Media Library: type
  (`IMAGE` \| `VIDEO` \| `BEFORE_AFTER` \| `YOUTUBE` \| `VIMEO` \| `AI` \| `LOTTIE`),
  R2 object key + public URL, dimensions, alt text, folder, tags, `usageCount`, protected-delete
  flag. **Media is never owned by one entity** — projects and others reference it (Constitution V).
- **Folder** — organises Media hierarchically: name, parent (self-ref).
- **Message** — a contact-form enquiry: name, email, subject, body, status
  (`UNREAD` \| `READ` \| `HANDLED`), source page, createdAt.
- **User** — an admin user: name, email, password hash, `role` (ref), active flag.
- **Role** — RBAC role: name, permissions set (least-privilege, Constitution XVII).
- **Settings** — singleton site configuration: site name, logo (Media ref), social links, SEO
  defaults, analytics IDs, contact details.

---

## Relationships

```text
Role ──1─────*── User
                  │ (createdBy / updatedBy on all content)
                  ▼
Client ──1────*── Project ──*────*── Service ──1────*── SubService
   │                 │  \
   │                 │   \──*────*── Media (gallery, videos, before/after)
   │                 │
   │                 └──*── Project (relatedProjects, self-reference)
   │
   └──1── Media (logo)

Folder ──1────*── Media ──*  (referenced by Projects, Clients, Testimonials, HomepageSections,
                              Settings, Page — never owned by them)

HomepageSection ──*  (ordered, enabled; some reference Projects/Services/Clients/Testimonials)

Testimonial ──*──1── Client (optional)

Message ──*  (created by public Contact flow; standalone)

Settings ──1 (singleton) ──> Media (logo), SEO defaults
```

**Cardinality notes**
- Client → Project: one-to-many.
- Project ↔ Service: many-to-many.
- Service → SubService: one-to-many.
- Project ↔ Media: many-to-many (via typed references: gallery / video / before-after).
- Project ↔ Project: many-to-many self-reference (related projects).
- User → Role: many-to-one; all content carries `createdBy` / `updatedBy`.

---

## Status lifecycle (all content types)

```text
        create
          │
          ▼
       DRAFT ───publish──► PUBLISHED ───archive──► ARCHIVED
          ▲                    │                       │
          └────────unpublish───┘                       │
          ▲───────────────restore───────────────────────┘
```

Only `PUBLISHED` content is visible on the public site. `publishedAt` is stamped on first publish.

---

## Reusability & multi-tenancy readiness

To honour Constitution VII without adding SaaS complexity now: every content and operational
entity is designed so a future `studioId` / tenant scope can be introduced as an additive column
+ query scope, **not** a redesign. V1 ships single-tenant with no `studioId`, but no relationship
assumes a global singleton except `Settings` (which itself would become tenant-scoped later).

---

## Entity → module map (Phase 2 build order)

| Module | Entities |
|---|---|
| Auth | User (auth), Role |
| Users / Roles | User, Role |
| Media | Media, Folder |
| Clients | Client |
| Services | Service, SubService |
| Projects | Project (+ refs to Client, Service, Media) |
| Homepage | HomepageSection |
| Settings | Settings |
| Messages | Message |
| Testimonials | Testimonial |
| Search | reads across all content + Media, Message, User |

No entity in this document is orphaned — each is owned by exactly one module and referenced only
through explicit relations (Constitution VIII).
