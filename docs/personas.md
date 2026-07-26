# StudioFlow — User Personas

> Phase 0 · Product Discovery
> Three primary personas drive every feature decision. If a feature serves none of them, question
> it. Related: [`product-vision.md`](./product-vision.md), [`user-flows.md`](./user-flows.md).

---

## 1. The Visitor

**Who:** A prospective client, a hiring peer, a journalist, or another creative evaluating the
studio. Arrives from search, social, referral, or an awards site. Often on mobile.

**Goals**
- Judge quickly whether this studio is credible and right for them.
- Get inspired by the work.
- Find a frictionless way to make contact.

**Needs**
- **Trust** — polished presentation, real clients, testimonials, clear services.
- **Inspiration** — immersive, cinematic case studies with rich media.
- **Contact** — an obvious, low-friction path to reach out.

**Pain points we remove**
- Slow, heavy pages that stutter on mobile.
- Portfolios that show pretty pictures but no context (no challenge/solution/results).
- Dead-end galleries with no call to action.

**Key tasks / journey**
Home → browse Projects → open a Project's case study → Contact.

**Success metric**
Reaches a project detail page and/or submits the contact form without frustration; Core Web
Vitals pass on the pages they touch.

**Constitution ties:** X (Performance), XI (SEO), XII (Accessibility), XIII (UX), VI (Case
studies).

---

## 2. The Studio Owner

**Who:** Founder or director of the studio. Non-developer. Time-poor. Cares about how the studio
is perceived and about turning visits into business.

**Goals**
- Keep the site current and on-brand without waiting on a developer.
- Publish new work fast, ideally the same day it's approved.
- See and act on incoming enquiries.

**Needs**
- **Publish work quickly** — a fast, low-click path from idea to published project.
- **Update content** — homepage, services, testimonials, clients, settings, SEO — all editable.
- **View messages** — a simple inbox for contact-form enquiries.

**Pain points we remove**
- "Email the developer to change the homepage."
- Fear of breaking the site by editing it.
- Not knowing whether enquiries are arriving.

**Key tasks / journey**
Login → Dashboard → create/edit a Project → publish; configure Homepage sections; read Messages.

**Success metric**
Can publish a new project and reorder the homepage unaided, and never needs a developer for
routine content.

**Constitution ties:** I (Content First), II (CMS First), III (Config over Hardcoding),
IV (Structured Flexibility), XIV (Dashboard Experience).

---

## 3. The Employee

**Who:** A content manager, designer, or junior creative on the studio team who does the hands-on
content work. Comfortable with tools like Notion or Figma; not a developer.

**Goals**
- Assemble and maintain project case studies.
- Keep the media library organised and reusable.

**Needs**
- **Create projects** — structured case-study editor with optional sections.
- **Upload & manage media** — a real media library: folders, search, tags, preview, usage counts,
  delete protection.

**Pain points we remove**
- Re-uploading the same asset for every project.
- Losing track of which images are used where.
- Rigid editors that force every field even when a project is simple.

**Key tasks / journey**
Login → Media (upload, organise) → Projects (create, attach existing media, fill sections) →
submit/publish per their role.

**Success metric**
Can build a complete case study reusing media from the library, within their permissions, in
minimal clicks.

**Constitution ties:** V (Rich Media First), VI (Case Studies), VIII (Modular), XV (Search),
XVII (Security / RBAC).

---

## Persona → capability matrix

| Capability | Visitor | Owner | Employee |
|---|:--:|:--:|:--:|
| Browse public site & case studies | ✅ | ✅ | ✅ |
| Submit contact form | ✅ | – | – |
| Read messages inbox | – | ✅ | role-based |
| Create / edit projects | – | ✅ | ✅ |
| Upload / manage media | – | ✅ | ✅ |
| Configure homepage sections | – | ✅ | role-based |
| Manage users, roles, settings | – | ✅ | – |

Role boundaries are enforced by RBAC (Constitution XVII) and detailed in
[`domain-model.md`](./domain-model.md).
