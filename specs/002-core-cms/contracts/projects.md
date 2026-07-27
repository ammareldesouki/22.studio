# Contract: Projects (case studies)

Base path `/api/projects`. Session required. Permissions: `projects:create|edit|publish|delete`
(deny-by-default). Extends Content Engine. Lists keyset-paginated + filterable by
`status`/`clientId`/`serviceId`/`featured`. Writes carry `version` (stale → 409).

## Endpoints
- `GET /api/projects?status=&clientId=&serviceId=&featured=&cursor=&limit=` → paginated summaries
- `GET /api/projects/:id` → full project incl. media refs, services, related
- `POST /api/projects` `{ title, ...allOptional }` → 201 — **only `title` required** (FR-016);
  slug auto-generated. Requires `projects:create`.
- `PATCH /api/projects/:id` `{ ...fields, clientId?, serviceIds?, mediaRefs?, relatedIds?, seo?, slug?, version }`
  → 200. Requires `projects:edit`. Media referenced by id (`ProjectMedia` type = gallery|video|
  before_after + order); referencing/unreferencing adjusts Media `usageCount` transactionally.
- `POST /api/projects/:id/status` `{ action: publish|unpublish|archive|restore, version }` → 200.
  `publish` requires `projects:publish`; stamps `publishedAt` on first publish.
- `DELETE /api/projects/:id` → 204. Requires `projects:delete`.

## Rules
- Missing `title` → 422. Slug unique per type (auto-suffix). Referenced Media cannot be deleted
  while this project references it. Related projects are self-referential (no cycles required).

Maps to FR-016–018; SC-001, SC-004, SC-005.
