# Contract: Health-check route

The only runtime HTTP contract introduced in Phase 1. Establishes runtime viability (US4) and gives
CI / future monitoring a stable probe.

## `GET /api/health`

Exposed by the `apps/admin` backend (Next.js route handler).

**Semantics**: **liveness only** — proves the app process is up and serving. It MUST NOT query the
database or any external service (FR-017, clarified). Data-layer verification is covered separately
by the CI migration check (FR-015).

### Request

- Method: `GET`
- Path: `/api/health`
- Auth: none (public, unauthenticated)
- Body: none

### Response — 200 OK

```json
{ "status": "ok" }
```

- Content-Type: `application/json`
- MUST return within normal request latency; MUST NOT depend on DB availability.

### Non-goals (Phase 1)

- No readiness/deep check, no DB ping, no dependency status map (deferred).
- No feature endpoints exist yet.

### Acceptance

- Maps to US4 scenario 3 (health route → 200) and SC-006.
- Verified by an integration test in `apps/admin/tests` and by the CI/quickstart curl step.
