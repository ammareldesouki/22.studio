# Contract: Users & Roles (RBAC)

Base paths `/api/users`, `/api/roles`. All require a valid session; each action requires the named
permission (deny-by-default → **403** if missing). Lists are keyset-paginated
(`?cursor=&limit=`). Writes carry `version` for optimistic concurrency (stale → **409**).

## Users — permission `users:manage`
- `GET /api/users` → paginated `[{ id, name, email, roleId, active }]`
- `POST /api/users` `{ name, email, password, roleId }` → 201 user
- `PATCH /api/users/:id` `{ name?, roleId?, active?, version }` → 200 (409 on stale)
- `POST /api/users/:id/password` `{ password }` → 204 (strength-validated)
- **Rules**: email unique (409/422 on dup); cannot deactivate the last owner-role user.

## Roles — permission `roles:manage`
- `GET /api/roles` → `[{ id, name, permissions[], isOwner }]`
- `POST /api/roles` `{ name, permissions[] }` → 201 (permissions ⊆ catalog, else 422)
- `PATCH /api/roles/:id` `{ name?, permissions?, version }` → 200 (409 on stale)
- `DELETE /api/roles/:id` → 204, **blocked (409)** if any user is assigned or if `isOwner`
- **GET /api/permissions** → the fixed catalog (read-only), for building roles.

Maps to FR-005, FR-006; SC-003. **Permission catalog** enumerated in `packages/types`.
