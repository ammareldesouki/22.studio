# Contract: Clients & Services

Base paths `/api/clients`, `/api/services`. Session required; writes need `clients:manage` /
`services:manage`. Both extend the Content Engine (status/slug/seo/version). Lists keyset-paginated;
writes carry `version` (stale → 409).

## Clients — `clients:manage`
- `GET /api/clients?cursor=&limit=&status=` → paginated
- `POST /api/clients` `{ name, logoId?, website?, order?, seo? }` → 201 (slug auto-generated)
- `PATCH /api/clients/:id` `{ ...fields, slug?, version }` → 200 (slug re-validated unique; 409 stale)
- `POST /api/clients/:id/status` `{ action: publish|unpublish|archive|restore, version }` → 200
- `DELETE /api/clients/:id` → 204, **409 blocked** if referenced by any project (archive instead)
- `POST /api/clients/reorder` `{ orderedIds[] }` → 200

## Services — `services:manage`
- Same shape as Clients, plus **SubServices**:
  - `POST /api/services/:id/subservices` `{ name, description?, order? }` → 201
  - `PATCH /api/subservices/:id` `{ ...fields }` → 200
  - `DELETE /api/subservices/:id` → 204
- `DELETE /api/services/:id` → 204, **409 blocked** if referenced by any project (archive instead)

Maps to FR-013–015; referential integrity per research §5.
