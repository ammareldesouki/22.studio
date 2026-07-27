# Contract: Auth

Session lifecycle for the admin backend. Base path `/api/auth`. All bodies JSON; all inputs
zod-validated (malformed → 400). No permission required to call `login`/`refresh`; `logout` requires
a valid session.

## POST /api/auth/login
- **Body**: `{ email: string, password: string }`
- **200**: sets refresh-token cookie (httpOnly, Secure, SameSite=Lax); returns
  `{ accessToken: string, user: { id, name, email, role: { id, name, permissions[] } } }`
- **401**: invalid credentials (generic message — no user enumeration)
- **429**: too many attempts (rate limited)

## POST /api/auth/refresh
- **Cookie**: refresh token. **Body**: none.
- **200**: rotates the refresh cookie; returns `{ accessToken }`
- **401**: missing/expired/revoked refresh token → client must re-login

## POST /api/auth/logout
- **Auth**: valid session. **200**: revokes the refresh token + clears the cookie.

## Cross-cutting
- Access JWT is short-lived, sent as `Authorization: Bearer <token>` on subsequent calls.
- Passwords hashed with bcrypt; never returned. Maps to FR-004, FR-006, FR-007; SC-003.
