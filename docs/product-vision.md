# StudioFlow — Product Vision

> Phase 0 · Product Discovery
> Source of truth for *why* StudioFlow exists. All specs, plans, and code trace back here and to
> `.specify/memory/constitution.md` (v1.0.0).

---

## What are we building?

StudioFlow is a **premium portfolio and content management platform for creative studios** —
production houses, branding agencies, AI creative agencies, animation studios, video editing
companies, and photography studios.

It is two products sharing one domain:

1. A **public website** that presents a studio's work as beautiful, cinematic case studies.
2. A **CMS** (admin app) that lets non-technical content managers run the entire public site.

StudioFlow is **not** just a portfolio website. It is a *content management platform specialised
for creative studios*, where the CMS experience is weighted equally with the public site.

---

## Why are we building it?

Creative studios sell visual work, but most portfolio solutions force a trade-off:

- **Template builders** (Framer/Webflow templates) look great but couple content to layout and
  quickly require a developer for structural change.
- **Generic CMSs** (WordPress, headline Sanity setups) are flexible but neither beautiful by
  default nor tuned for case-study-driven creative work.
- **Bespoke sites** look stunning but calcify — every content change becomes a developer ticket.

StudioFlow removes that trade-off: a studio gets an Awwwards-grade public site **and** a CMS that
lets its own team publish and evolve content with zero developer involvement.

---

## Who is it for?

| Audience | Role | What they get |
|---|---|---|
| **Visitors** | Prospective clients, peers, press | Trust, inspiration, a clear path to contact |
| **Studio Owner** | Runs the studio | Publish work fast, manage all content, read enquiries |
| **Employee** | Content manager / creative | Create projects, upload and organise media |

Full detail in [`personas.md`](./personas.md).

---

## What problem does it solve?

- **Content velocity** — routine content changes (projects, services, homepage, testimonials,
  settings, SEO) never require code changes or a redeploy.
- **Presentation quality** — a premium, cinematic visitor experience out of the box.
- **Media reality** — creative studios are media-heavy; media is a first-class, reusable asset,
  not an attachment bolted to one page.
- **Reuse** — one studio today, many studios tomorrow, without a rewrite.

---

## What makes it different?

1. **CMS-first.** The admin panel is a first-class product, benchmarked against Notion, Framer
   CMS, Sanity, and Webflow CMS — not a bolted-on `/wp-admin`.
2. **Structured flexibility.** Pages are composed from predefined, reusable sections that admins
   enable / disable / reorder / configure — powerful, but never a raw drag-and-drop HTML builder.
3. **Content Engine.** Every content type shares one base (status, SEO, slug, featured, audit,
   versioning-ready), so the CMS is uniform and cheap to extend.
4. **Projects are case studies**, not galleries — challenge / solution / results, media,
   client, services, related work; every field optional except the title.
5. **Reusable, SaaS-ready architecture** without paying SaaS complexity in v1.

---

## Scope of Version 1

**In scope:** a single-studio deployment with a complete CMS (auth, users, roles, media library,
clients, services, projects, homepage builder, settings) and a complete public website driven
entirely from that CMS, plus messages, testimonials, team, and global search.

**Explicitly deferred (Phase 6):** multi-studio/multi-tenant, billing, white-label, public API,
blog, client portal, approval workflows, invoices, quote requests, collections.

**Non-negotiable constraint:** V1 is *not* a SaaS, but **every architectural decision must keep
the system SaaS-ready and reusable for additional studios without a rewrite** — while never
introducing SaaS machinery before it is actually needed (Constitution VII, XVIII).

---

## Definition of Success

A successful v1 lets a creative studio:

- Showcase its work beautifully.
- Manage **all** website content without developers.
- Publish projects quickly.
- Scale content effortlessly (≈20 → ≈20,000 projects).
- Deliver an excellent visitor experience.
- Generate business opportunities (enquiries).
- Remain maintainable for years.

## Definition of Failure

The project fails if:

- Developers are required for simple content updates.
- Performance significantly degrades as content grows.
- Business logic becomes tightly coupled.
- Modules become mutually dependent.
- The CMS becomes difficult to use.
- The architecture prevents future evolution.
- Design becomes more important than usability.

Each failure mode has a mitigating decision recorded in
[`implementation-plan.md`](./implementation-plan.md).

---

## The one question every decision must answer

> *"Will this make StudioFlow easier to maintain, easier to extend, and easier for creative
> studios to manage over the next five years?"*

If the answer is no, the design is reconsidered before implementation.
