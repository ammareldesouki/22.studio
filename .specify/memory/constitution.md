<!--
SYNC IMPACT REPORT
==================
Version change: (template / unratified) → 1.0.0
Bump rationale: Initial ratification. First concrete constitution replacing the
  unfilled template placeholders. MAJOR baseline established.

Modified principles: N/A (initial adoption)
Added sections:
  - Core Principles (I–XVIII): Content First, CMS First, Configuration over Hardcoding,
    Structured Flexibility, Rich Media First, Projects are Case Studies, Reusable Architecture,
    Modular Design, Scalability, Performance First, SEO First, Accessibility, User Experience,
    Dashboard Experience, Search Everywhere, Extensibility, Security, Simplicity
  - Product Definition & Priorities (vision, mission, philosophy, success/failure)
  - Engineering Standards
  - Governance
Removed sections: All template placeholder sections replaced.

Templates requiring updates:
  ✅ .specify/templates/plan-template.md — Constitution Check gate is generic; resolves
     against this file dynamically. No hardcoded principle references. No edit required.
  ✅ .specify/templates/spec-template.md — Generic; mandatory sections unaffected. No edit required.
  ✅ .specify/templates/tasks-template.md — No constitution/principle references. No edit required.
  ✅ .specify/templates/checklist-template.md — No constitution/principle references. No edit required.
  ✅ .claude/skills/speckit-*/SKILL.md — Agent-generic; no outdated references introduced.

Follow-up TODOs: None. All placeholders resolved.
-->

# StudioFlow Constitution

StudioFlow is a premium portfolio and content management platform for creative studios —
production houses, branding agencies, AI creative agencies, animation studios, video editing
companies, and photography studios. Version 1 targets a single-studio deployment, yet every
architectural decision MUST keep the system SaaS-ready and reusable for additional studios
without a rewrite. The platform MUST feel comparable to LaunchFolio, Framer templates, Behance
case studies, and modern Awwwards sites while remaining effortless for content managers.

The CMS experience is a first-class product, weighted equally with the public website. Every
decision is prioritized in this order: Content Management → Content Presentation → Performance →
Developer Experience.

## Core Principles

### I. Content First

Everything editors frequently change is content: projects, services, clients, homepage
sections, testimonials, team members, site settings, and SEO metadata. No content that editors
routinely change may require source-code modification or a redeploy. Rationale: content velocity
is the primary value of the platform; coupling content to code destroys it.

### II. CMS First

The administration panel is a first-class product, never an afterthought. A content editor MUST
be able to update the entire public website — every page, section, and asset exposed to visitors
— without developer assistance. Rationale: developer dependency for routine edits is an explicit
Definition of Failure.

### III. Configuration over Hardcoding

Business behavior MUST be configurable rather than hardcoded wherever feasible. Homepage data,
featured projects, services, testimonials, clients, hero content, and statistics MUST live in
the CMS, never in source. Rationale: hardcoded business data is unmaintainable and
non-reusable across studios.

### IV. Structured Flexibility

The system MUST provide layout flexibility WITHOUT becoming a free-form drag-and-drop page
builder. Pages are assembled from predefined, reusable sections. Administrators MAY enable,
disable, reorder, and configure the content and appearance of sections; they MUST NOT edit raw
HTML. Rationale: bounded composition preserves design quality and maintainability while still
empowering editors.

### V. Rich Media First

Rich media is a first-class citizen: images, videos, before/after, YouTube, Vimeo, AI-generated
media, and Lottie animations. Media MUST NOT be tightly coupled to a single entity; assets live
in a central Media Library and are referenced by projects and other entities. Rationale: creative
studios sell visual work, and reusable media is essential to scale and consistency.

### VI. Projects are Case Studies

Projects model creative work as case studies, not mere galleries. A project MAY include overview,
description, gallery, videos, before/after, client, services, optional sub-services, challenge,
solution, results, external links, SEO, and related projects. Every field except the title MUST
be optional. Rationale: the platform must serve both simple portfolios and detailed case studies
from one model.

### VII. Reusable Architecture

Although V1 serves one studio, the architecture MUST NOT bake in assumptions that permanently
bind the system to a single organization; future multi-tenant evolution MUST remain possible.
SaaS-specific complexity MUST NOT be introduced until actually required. Rationale: reusability
is a founding constraint, but premature SaaS machinery violates Simplicity.

### VIII. Modular Design

Each domain — authentication, users, roles, projects, clients, services, media library, homepage
builder, SEO, settings, messages, testimonials, analytics — MUST remain isolated with clear
responsibilities and communicate through well-defined interfaces. Modules MUST NOT become
mutually dependent. Rationale: cross-module coupling is an explicit Definition of Failure.

### IX. Scalability

The system MUST scale from ~20 to ~20,000 projects without architectural redesign. Large media
libraries MUST remain manageable, and search and filtering MUST remain performant at the upper
bound. Rationale: content growth must never force a rebuild.

### X. Performance First

Performance is a product requirement, not an optimization phase. Public pages MUST employ fast
loading, lazy loading, optimized images, optimized video delivery, caching, pagination, code
splitting, modern image formats, and minimal JavaScript, and MUST meet Core Web Vitals targets.
Rationale: performance degradation as content grows is a Definition of Failure.

### XI. SEO First

Every public page MUST support SEO title, meta description, canonical URL, slug, OpenGraph,
Twitter Card, and structured data, with automatic sitemap generation and robots configuration.
SEO MUST NOT be retrofitted. Rationale: discoverability is core business value for studios.

### XII. Accessibility

Accessibility is mandatory: keyboard navigation, semantic HTML, screen-reader support, visible
focus states, reduced-motion support, alt text, and contrast compliance (WCAG AA as the baseline
target). Rationale: accessibility is both an ethical and legal requirement and a usability
multiplier.

### XIII. User Experience

The public website MUST feel premium, elegant, modern, minimal, cinematic, fast, immersive, and
professional. Animations MUST enhance the experience without harming usability, and content MUST
remain the primary focus. Rationale: design serves usability — when design harms usability the
project fails.

### XIV. Dashboard Experience

The CMS MUST prioritize productivity: editors accomplish common tasks with minimal clicks. The
dashboard MUST feel closer to Notion, Framer CMS, Sanity, or Webflow CMS than to a traditional
enterprise admin. Rationale: a hard-to-use CMS is a Definition of Failure.

### XV. Search Everywhere

Global search is a platform capability, MUST span projects, clients, services, media, messages,
and team members, and future modules MUST integrate with it. Rationale: unified search keeps the
platform navigable as content scales.

### XVI. Extensibility

The architecture MUST allow future modules — quote requests, blog, careers, collections, project
categories, tags, client portal, approval workflow, billing, public API, and SaaS — to be added
without breaking existing features. Rationale: the platform must grow over years without
regression.

### XVII. Security

Security is mandatory: validate all inputs, protect uploads, protect authentication and
authorization, apply least privilege, never trust frontend validation, and never expose secrets.
Rationale: user trust and data integrity are non-negotiable.

### XVIII. Simplicity

When multiple designs satisfy a requirement, the simpler solution MUST be preferred. Unnecessary
abstractions, premature optimization, and overengineering MUST be avoided, and any complexity
MUST be explicitly justified. Rationale: unjustified complexity undermines maintainability, the
platform's five-year goal.

## Product Definition & Priorities

**Definition of Success** — A successful implementation lets a creative studio showcase its work
beautifully, manage all website content without developers, publish projects quickly, scale
content effortlessly, deliver an excellent visitor experience, generate business opportunities,
and remain maintainable for years.

**Definition of Failure** — The project fails if developers are required for simple content
updates; if performance significantly degrades as content grows; if business logic becomes
tightly coupled; if modules become mutually dependent; if the CMS becomes difficult to use; if
the architecture prevents future evolution; or if design becomes more important than usability.

These definitions are binding acceptance criteria: any feature that moves the system toward a
Definition of Failure MUST be reconsidered before implementation.

## Engineering Standards

All engineering work MUST prefer: composition over inheritance; configuration over hardcoding;
reusable components; feature isolation; explicit contracts between modules; maintainability over
cleverness; readability over brevity; predictable behavior; and consistency across the platform.

These standards operationalize the Core Principles and are enforced during review. Deviations
MUST be documented and justified under the Governance complexity-justification rule.

## Governance

This constitution supersedes other development practices. When guidance conflicts, the
constitution wins.

**Amendment procedure**: Amendments MUST be proposed as a change to this file, include a written
rationale, and be approved by the project maintainer before merge. Amendments that materially
change principles MUST include a migration note describing impact on existing artifacts.

**Versioning policy**: This constitution uses semantic versioning. MAJOR increments cover
backward-incompatible governance changes or principle removals/redefinitions; MINOR increments
cover new principles or materially expanded guidance; PATCH increments cover clarifications and
non-semantic refinements.

**Compliance review**: Every plan, spec, and task set produced via Spec Kit MUST pass the
Constitution Check gate. All pull requests and reviews MUST verify compliance with the principles
above. Any complexity that appears to violate Simplicity (XVIII) MUST be justified in the plan's
Complexity Tracking section or be rejected.

**Guiding question**: Every technical decision MUST answer — "Will this make StudioFlow easier to
maintain, easier to extend, and easier for creative studios to manage over the next five years?"
If the answer is no, the design MUST be reconsidered before implementation.

**Version**: 1.0.0 | **Ratified**: 2026-07-25 | **Last Amended**: 2026-07-25
