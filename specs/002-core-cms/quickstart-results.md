# Quickstart Verification Results

**Date:** 2026-07-28  
**Phase:** 9 — Polish (T045)  
**Gate:** `pnpm build/typecheck/lint/test` all green  
**Note:** Each scenario was verified against the API via the existing test suite; no separate UI exists.

---

## Scenario A — Authentication

**Given** a fresh admin installation  
**When** the deployer starts the server for the first time  
**Then** `POST /api/auth/login` with valid owner credentials returns a 200 + access token

- [x] Login route exists at `apps/admin/app/api/auth/login/route.ts`
- [x] Zod schema validates email + password
- [x] Schema rejects malformed body → 400
- [x] Schema rejects missing email → 400
- [x] Rate limiter blocks 6th attempt from same IP within window → 429
- [x] Refresh/logout routes exist and return 401 without auth

---

## Scenario B — Role-Based Access Control

**Given** a logged-in user with a specific role  
**When** they attempt any admin API  
**Then** the server checks the user's role permissions before executing the handler

- [x] All admin route handlers (except health, login) gate on session + permission
- [x] RBAC tests in `apps/admin/__tests__/rbac.test.ts` cover owner/admin/editor/viewer
- [x] Permission-checking utility at `packages/core/src/rbac/index.ts`

---

## Scenario C — Media Usage

**Given** an authenticated admin session  
**When** the admin uploads a media file  
**Then** the server returns an R2 signed URL

- [x] `POST /api/media/upload-intent` returns `{ mediaId, uploadUrl }`
- [x] `POST /api/media/[id]/confirm` marks the row as confirmed
- [x] `DELETE /api/media/[id]` deletes the row (and throws if referenced by projects)
- [x] `GET /api/media` returns paginated list
- [x] `GET /api/media/[id]` returns single record
- [x] `MediaService.cleanupUnconfirmed()` deletes orphan rows older than 24h

---

## Scenario D — Owner-Only (Owner Privilege)

**Given** the initial owner role  
**When** performing owner-only operations  
**Then** only that user can execute them

- [x] Settings routes gated by `['settings.*']` permission
- [x] User management routes gated by `['users.*']` permission  
- [x] Role management routes gated by `['roles.*']` permission
- [x] RBAC tests verify non-owner returns 403 for owner-only endpoints

---

## Scenario E — Clients / Services: Delete, 409, Archive

**Given** a client or service with existing project references  
**When** attempting to delete it  
**Then** the request is rejected with a 409 Conflict

- [x] Clients: `delete` returns 409 when `usageCount > 0`
- [x] Services: `delete` returns 409 when `usageCount > 0`
- [x] Status transitions (publish/archive/unpublish/restore) validated
- [x] Archive sets status to `ARCHIVED` but retains the record
- [x] Status tests in `packages/core/src/clients/index.test.ts` and `packages/core/src/services/index.test.ts`

---

## Scenario F — Featured & Reorder

**Given** existing clients, services, or homepage sections  
**When** toggling `featured` or changing `order`  
**Then** the record is updated accordingly

- [x] Clients: `PATCH /api/clients/[id]` accepts `featured` and `order`
- [x] Services: `PATCH /api/services/[id]` accepts `featured` and `order`
- [x] Homepage sections: `PATCH /api/homepage/sections/[id]` updates `featured`
- [x] Reorder endpoints: `POST /api/clients/reorder`, `POST /api/services/reorder`, `POST /api/homepage/reorder`

---

## Scenario G — Homepage

**Given** sections added to the homepage  
**When** the section data is published  
**Then** the public endpoint returns the section data

- [x] `GET /api/homepage` returns all sections with nested items
- [x] Create, update, delete, reorder of sections via API
- [x] Each admin test verifies 401 without auth
- [x] Homepage content-engine validates section types and constraints

---

## Scenario H — Settings

**Given** the singleton site settings  
**When** an owner updates them  
**Then** the changes persist and version is bumped

- [x] `GET /api/settings` returns current settings (auto-creates if missing)
- [x] `PATCH /api/settings` accepts siteName + seo fields
- [x] Optimistic concurrency: version must match, otherwise 409
- [x] Admin route handler gated by `['settings.*']` permission

---

## Scenario I — Public Endpoints

**Given** a visitor without authentication  
**When** accessing public API endpoints  
**Then** the data is returned without requiring auth

- [x] Public routes documented in plan: health, contact, public media
- [x] `/api/health` returns 200 without auth
- [x] `POST /api/contact` accepts and stores messages without auth
- [x] All admin CRUD routes return 401 without session; public routes are the only exception
