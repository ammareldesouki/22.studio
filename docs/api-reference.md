# StudioFlow Admin API Reference

Base URL (local dev): `http://localhost:3000`

All routes live under `apps/admin/app/api`. Request/response bodies are JSON.

---

## Authentication model

There are **two tokens**:

| Token | Where it lives | Lifetime | Used for |
|-------|----------------|----------|----------|
| **Access token** (JWT) | Returned in the JSON body of `POST /api/auth/login` and `POST /api/auth/refresh`. You send it back on every protected request. | Short-lived | Authorizing API calls |
| **Refresh token** | Set automatically as an **HttpOnly cookie** (`refresh_token`, `Path=/api/auth`). You never read or send it manually — the browser does. | 7 days | Getting a new access token |

### How protected routes read the token

Every protected route calls `guardRoute(request, permission)` → `getSession()`, which expects the access token in the **`Authorization` header** as a Bearer token:

```
Authorization: Bearer <accessToken>
```

- No header / malformed header / bad token → **401 Unauthorized**.
- Valid token but the user's role lacks the required permission → **403 Forbidden**.

### Permissions catalog

Roles hold a subset of these (`packages/types/src/permissions.ts`):

```
projects:create   projects:edit   projects:publish   projects:delete
media:upload      media:delete    clients:manage     services:manage
homepage:manage   users:manage    roles:manage       settings:manage
```

- User routes require `users:manage`.
- Role & permission routes require `roles:manage`.

---

## 1. Auth

### `POST /api/auth/login`  — public

Log in with email + password. Returns an access token and sets the `refresh_token` cookie. Rate-limited to **5 attempts / 60s per IP** (429 when exceeded).

**Request body**
```json
{
  "email": "owner@studio.test",
  "password": "correcthorse"
}
```

**200 response**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "3f...",
    "name": "Studio Owner",
    "email": "owner@studio.test",
    "role": { "id": "1a...", "name": "Owner", "permissions": ["users:manage", "roles:manage"] }
  }
}
```

**Errors:** `400` malformed body · `401` invalid credentials / deactivated account · `429` too many attempts.

---

### `POST /api/auth/refresh`  — cookie-based

Rotates the refresh token and issues a new access token. Reads the `refresh_token` **cookie** (no body, no Authorization header needed).

**Request:** no body. The browser sends the cookie automatically.

**200 response**
```json
{ "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**Errors:** `401` no / invalid / expired refresh token, or user no longer active.

---

### `POST /api/auth/logout`  — 🔒 requires access token

Revokes **all** refresh tokens for the current user and clears the cookie.

**Headers:** `Authorization: Bearer <accessToken>`
**Request:** no body.

**200 response**
```json
{ "ok": true }
```

**Errors:** `401` missing / invalid access token.

---

## 2. Users  🔒 requires `users:manage`

All routes need `Authorization: Bearer <accessToken>`.

### `GET /api/users`
List all users.

**200:** `[ { "id", "name", "email", "roleId", "active", "version", ... }, ... ]`

---

### `POST /api/users`
Create a user.

**Request body**
```json
{
  "name": "Jane Editor",
  "email": "jane@studio.test",
  "password": "atleast8chars",
  "roleId": "1a2b3c4d-0000-0000-0000-000000000000"
}
```
Rules: `password` ≥ 8 chars, `email` valid, `roleId` a UUID.

**201:** the created user object.
**Errors:** `400` validation · `401` no token · `403` missing permission · `409` email already in use.

---

### `PATCH /api/users/:id`
Update a user. Uses **optimistic concurrency** — `version` is required and must match the current row.

**Request body** (all except `version` optional)
```json
{
  "name": "Jane Senior Editor",
  "roleId": "1a2b3c4d-0000-0000-0000-000000000000",
  "active": true,
  "version": 1
}
```

**200:** updated user. **Errors:** `400` · `401` · `403` · `404` not found · `409` version conflict.

---

### `POST /api/users/:id/password`
Set / reset a user's password.

**Request body**
```json
{ "password": "newpassword8+" }
```

**204 No Content** on success. **Errors:** `400` · `401` · `403` · `404`.

---

## 3. Roles  🔒 requires `roles:manage`

All routes need `Authorization: Bearer <accessToken>`.

### `GET /api/roles`
List all roles.

**200:** `[ { "id", "name", "permissions": [...], "isOwner", "version" }, ... ]`

---

### `POST /api/roles`
Create a role. `permissions` must be values from the catalog above.

**Request body**
```json
{
  "name": "Content Editor",
  "permissions": ["projects:create", "projects:edit", "media:upload"]
}
```

**201:** created role. **Errors:** `400` · `401` · `403` · `409` name taken.

---

### `PATCH /api/roles/:id`
Update a role. `version` required (optimistic concurrency).

**Request body**
```json
{
  "name": "Content Editor",
  "permissions": ["projects:create", "projects:edit", "projects:publish"],
  "version": 2
}
```

**200:** updated role. **Errors:** `400` · `401` · `403` · `404` · `409`.

---

### `DELETE /api/roles/:id`
Delete a role.

**204 No Content** on success. **Errors:** `401` · `403` · `404`.

---

## 4. Permissions  🔒 requires `roles:manage`

### `GET /api/permissions`
Returns the permission catalog (grouped, for rendering a role editor).

**Headers:** `Authorization: Bearer <accessToken>`
**200:** the catalog object from `rolesService.getCatalog()`.

---

## 5. Utility (public)

### `POST /api/contact`
Public contact form. No auth, no persistence (Phase 1 stub).

**Request body**
```json
{ "name": "Visitor", "email": "hi@example.com", "message": "Hello!" }
```
Rules: `message` ≤ 1000 chars.

**200:** `{ "success": true, "data": { ... } }` · `400` validation.

### `GET /api/health`
Liveness probe. No auth.

**200:** `{ "status": "ok" }`

---

## Quick start (curl)

```bash
# 1. Log in — capture the access token and the refresh cookie
curl -s -c cookies.txt http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@studio.test","password":"correcthorse"}'

# 2. Call a protected route with the inherited access token
TOKEN="<paste accessToken from step 1>"
curl -s http://localhost:3000/api/users -H "Authorization: Bearer $TOKEN"

# 3. Create a user
curl -s http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Jane","email":"jane@studio.test","password":"atleast8chars","roleId":"<uuid>"}'

# 4. Refresh the access token using the stored cookie
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/refresh
```

---

## Endpoint summary

| Method | Path | Auth | Permission |
|--------|------|------|------------|
| POST | `/api/auth/login` | public | — |
| POST | `/api/auth/refresh` | refresh cookie | — |
| POST | `/api/auth/logout` | 🔒 Bearer | any authenticated |
| GET | `/api/users` | 🔒 Bearer | `users:manage` |
| POST | `/api/users` | 🔒 Bearer | `users:manage` |
| PATCH | `/api/users/:id` | 🔒 Bearer | `users:manage` |
| POST | `/api/users/:id/password` | 🔒 Bearer | `users:manage` |
| GET | `/api/roles` | 🔒 Bearer | `roles:manage` |
| POST | `/api/roles` | 🔒 Bearer | `roles:manage` |
| PATCH | `/api/roles/:id` | 🔒 Bearer | `roles:manage` |
| DELETE | `/api/roles/:id` | 🔒 Bearer | `roles:manage` |
| GET | `/api/permissions` | 🔒 Bearer | `roles:manage` |
| POST | `/api/contact` | public | — |
| GET | `/api/health` | public | — |
