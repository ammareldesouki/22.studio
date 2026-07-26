# StudioFlow — User Flows

> Phase 0 · Product Discovery
> The core journeys for each persona. These flows drive the module build order in
> [`implementation-plan.md`](./implementation-plan.md). Related:
> [`personas.md`](./personas.md), [`domain-model.md`](./domain-model.md).

---

## Visitor — Discover & Contact

```text
Home
  │  (hero, featured projects, services, clients, stats, testimonials, CTA)
  ▼
Projects
  │  (filter / paginate the work)
  ▼
Project Details  ── case study: overview, media, challenge/solution/results, client, services
  │
  ├──► Related Projects ──┐
  │                       │ (loop back into more case studies)
  ▼                       │
Contact  ◄────────────────┘
  │  (submit enquiry → creates a Message in the CMS)
  ▼
Confirmation
```

Secondary visitor paths: Home → Services → Contact; Home → About → Contact; direct entry to any
Project Details via a shared/SEO link.

**What this flow requires from the platform**
- Every page's content comes from the CMS — nothing hardcoded (Constitution I, III).
- Fast, lazy-loaded, media-optimised pages (X); full SEO tags + structured data (XI); accessible
  navigation (XII).
- Contact submission persists a `Message` (see domain model).

---

## Studio Owner — Publish & Manage

```text
Login
  ▼
Dashboard
  │  (at-a-glance: recent projects, unread messages, quick actions)
  ├──► Projects ──► Create / Edit ──► fill sections ──► Publish (Draft→Published)
  ├──► Homepage Builder ──► enable / disable / reorder / configure sections
  ├──► Messages ──► read enquiry ──► mark handled
  └──► Settings ──► site name, logo, social, SEO defaults, analytics, contact
```

**What this flow requires**
- Minimal-click, Notion/Framer-grade admin UX (XIV).
- Section-based homepage composition, never raw HTML editing (IV).
- Publishing lifecycle Draft → Published → Archived on all content (Content Engine).

---

## Employee — Build a Case Study (media-first)

```text
Login
  ▼
Dashboard
  ▼
Media Library
  │  (upload → organise into folders → tag → preview)
  ▼
Projects ──► Create
  │
  ├─ General   (title required; overview, description optional)
  ├─ Media     (attach EXISTING assets from the library — not fresh uploads)
  ├─ SEO       (title, meta, slug, OG, structured data)
  ├─ Related   (link related projects)
  └─ Publishing (Draft → submit / Publish per role)
```

### Why media comes *before* projects

Projects **reference** reusable media from a central library; they do not own uploads
(Constitution V). Therefore the media capability must exist and be populated before the project
editor is useful. This ordering is mirrored in the Phase 2 build sequence:

```text
Auth → Users → Roles → Media → Clients → Services → Projects → Homepage → Settings
```

---

## Cross-cutting flow: Global Search

```text
Any admin screen
  ▼
Global Search (⌘K)
  ▼
Results across: Projects · Clients · Services · Media · Messages · Team
  ▼
Jump directly to the entity
```

Every future module must plug into this same search surface (Constitution XV).

---

## Flow → module dependency summary

| Flow | Primary modules exercised |
|---|---|
| Visitor Discover & Contact | Public web, Projects, Services, Clients, Homepage, Messages, SEO |
| Owner Publish & Manage | Auth, Projects, Homepage, Messages, Settings |
| Employee Build Case Study | Auth, Media, Clients, Services, Projects |
| Global Search | Search + all content modules |

These dependencies justify the Phase 2 ordering and the Phase 3 (public site) sequencing in the
[implementation plan](./implementation-plan.md).
