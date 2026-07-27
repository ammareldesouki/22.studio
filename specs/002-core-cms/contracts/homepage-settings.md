# Contract: Homepage & Settings

Base paths `/api/homepage`, `/api/settings`. Session required; permissions `homepage:manage` /
`settings:manage`. Writes carry `version` (stale → 409).

## Homepage — `homepage:manage`
- `GET /api/homepage` → ordered list of sections `[{ id, type, enabled, order, config }]`
- `PATCH /api/homepage/sections/:id` `{ enabled?, config?, version }` → 200
  (config validated against the **section-type schema**; raw HTML rejected — FR-019)
- `POST /api/homepage/reorder` `{ orderedIds[] }` → 200
- `POST /api/homepage/sections` `{ type }` → 201 (only catalog types:
  HERO|SERVICES|PROJECTS|CLIENTS|STATS|TESTIMONIALS|FAQ|CTA)
- `DELETE /api/homepage/sections/:id` → 204

## Settings (singleton) — `settings:manage`
- `GET /api/settings` → the single settings record
- `PATCH /api/settings` `{ siteName?, logoId?, socialLinks?, seoDefaults?, analyticsIds?, contact?, version }`
  → 200 (409 stale)

Maps to FR-019, FR-020; SC-002, SC-006. No raw-HTML editing path exists anywhere.
