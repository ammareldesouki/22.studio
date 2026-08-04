# Client Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add client reviews to the 22 Studio site — a homepage reviews section (quote → text → name), a hide-when-empty "reviews" hero button that scrolls to it, and an admin Reviews manager to add/edit/reorder/hide/delete reviews.

**Architecture:** Reviews are a lightweight, non-localized lookup list modeled exactly on the existing `Budget` entity (single row, `active` boolean, `order`) — not the heavy content-engine entities. One review = one `quote` + one `authorName`, shown identically on `/en` and `/ar`. Data flows: Prisma `Review` model → `ReviewsService` (core) → admin CRUD API + `publicContent.listReviews()` → admin page + public `reviews.tsx` section.

**Tech Stack:** Next.js (App Router) monorepo, Prisma + Postgres (Supabase), Zod validation, next-intl, Tailwind, Vitest. pnpm workspaces (`@studioflow/*`).

## Global Constraints

- Reviews are **not localized**: a single `quote` string is shown as-is on both locales. No `quoteEn`/`quoteAr`, no per-locale rows.
- Mirror the **Budget** entity patterns exactly for model, validation, core service, and admin API/page (`packages/core/src/budgets`, `apps/admin/app/api/budgets`, `apps/admin/app/(app)/budgets/page.tsx`, `packages/validation/src/budgets.ts`).
- Admin routes are guarded with the existing `PERMISSIONS.SETTINGS_MANAGE` (same as Budgets) — **do not add a new permission** (avoids DB permission seeding).
- Prisma migrations run against `DIRECT_URL` (port 5432) per project DB conventions; the app uses the pooled URL.
- Public reads filter `active: true` and order by `order` asc, then `createdAt` asc.
- Follow existing file conventions: named exports, `as const` selects, `.toISOString()` for dates, `btn`/`panel`/`field`/`input`/`chip`/`wrap`/`eyebrow` CSS classes already defined in the apps.
- Package export maps must be updated when adding new subpath modules (`packages/*/package.json` `exports`).

---

### Task 1: Prisma `Review` model + migration

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (add model after the `Budget` model, ~line 470)

**Interfaces:**
- Produces: Prisma model `Review { id, quote, authorName, order, active, createdAt, updatedAt }` and generated `db.review` delegate.

- [ ] **Step 1: Add the model**

Add to `packages/db/prisma/schema.prisma` (place it right after the `Budget` model):

```prisma
model Review {
  id         String   @id @default(uuid()) @db.Uuid
  quote      String              // the review text — one value, shown on both EN & AR
  authorName String              // client name
  order      Int      @default(0)
  active     Boolean  @default(true)   // false = hidden from the site
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([order])
  @@index([active])
}
```

- [ ] **Step 2: Create the migration**

Run (requires `DATABASE_URL` + `DIRECT_URL` set in `packages/db/.env`):

```bash
pnpm --filter @studioflow/db exec prisma migrate dev --name add_review
```

Expected: a new folder `packages/db/prisma/migrations/<timestamp>_add_review/migration.sql` containing `CREATE TABLE "Review" ...`, and the Prisma client regenerates.

- [ ] **Step 3: Verify the client generated**

Run:

```bash
pnpm --filter @studioflow/db exec prisma generate
```

Expected: success, no errors. `db.review` is now available.

- [ ] **Step 4: Commit**

```bash
git add packages/db/prisma/schema.prisma packages/db/prisma/migrations
git commit -m "feat(db): add Review model and migration"
```

---

### Task 2: Validation schemas

**Files:**
- Create: `packages/validation/src/reviews.ts`
- Modify: `packages/validation/package.json` (add `"./reviews"` to `exports`)
- Test: `packages/validation/src/reviews.test.ts`

**Interfaces:**
- Produces: `createReviewSchema`, `updateReviewSchema` (Zod), and `@studioflow/validation/reviews` subpath.
- Consumes: `zod`.

- [ ] **Step 1: Write the failing test**

Create `packages/validation/src/reviews.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createReviewSchema, updateReviewSchema } from './reviews';

describe('createReviewSchema', () => {
  it('accepts a valid review', () => {
    const r = createReviewSchema.safeParse({ quote: 'Great work!', authorName: 'Guy Hawkins' });
    expect(r.success).toBe(true);
  });

  it('rejects an empty quote', () => {
    const r = createReviewSchema.safeParse({ quote: '', authorName: 'Guy' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty authorName', () => {
    const r = createReviewSchema.safeParse({ quote: 'Nice', authorName: '' });
    expect(r.success).toBe(false);
  });
});

describe('updateReviewSchema', () => {
  it('allows a partial update (active only)', () => {
    const r = updateReviewSchema.safeParse({ active: false });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @studioflow/validation test -- reviews`
Expected: FAIL — cannot find module `./reviews`.

- [ ] **Step 3: Write the schemas**

Create `packages/validation/src/reviews.ts`:

```ts
import { z } from 'zod';

// Client reviews shown on the marketing site. Not localized — one `quote` string is shown
// as-is on both the EN and AR sites. Modeled on the lightweight Budget list (no SEO/slug).
export const createReviewSchema = z.object({
  quote: z.string().min(1).max(1000),
  authorName: z.string().min(1).max(120),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const updateReviewSchema = z.object({
  quote: z.string().min(1).max(1000).optional(),
  authorName: z.string().min(1).max(120).optional(),
  order: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});
```

- [ ] **Step 4: Add the export subpath**

In `packages/validation/package.json`, add to `"exports"` (after `"./budgets"`):

```json
    "./reviews": "./src/reviews.ts",
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @studioflow/validation test -- reviews`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/validation/src/reviews.ts packages/validation/src/reviews.test.ts packages/validation/package.json
git commit -m "feat(validation): add review create/update schemas"
```

---

### Task 3: Core `ReviewsService`

**Files:**
- Create: `packages/core/src/reviews/index.ts`
- Modify: `packages/core/package.json` (add `"./reviews"` to `exports`)
- Test: `packages/core/src/reviews/index.test.ts`

**Interfaces:**
- Consumes: `db` from `@studioflow/db`.
- Produces:
  - `ReviewRecord = { id: string; quote: string; authorName: string; order: number; active: boolean; createdAt: string; updatedAt: string }`
  - `reviewsService` with `list(): Promise<ReviewRecord[]>`, `listActive(): Promise<ReviewRecord[]>`, `getById(id): Promise<ReviewRecord | null>`, `create(input): Promise<ReviewRecord>`, `update(id, input): Promise<ReviewRecord>`, `delete(id): Promise<void>`.
  - `ReviewsError extends Error` with `code: string`, `statusCode: number`.
  - Subpath `@studioflow/core/reviews`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/reviews/index.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewsService, ReviewsError } from '.';

vi.mock('@studioflow/db', () => ({
  db: {
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const { db } = await import('@studioflow/db');

beforeEach(() => {
  vi.clearAllMocks();
});

const row = {
  id: 'r1',
  quote: 'Great work!',
  authorName: 'Guy Hawkins',
  order: 0,
  active: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('reviewsService.listActive', () => {
  it('filters active and maps dates to ISO strings', async () => {
    (db.review.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([row]);
    const out = await reviewsService.listActive();
    expect(db.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } }),
    );
    expect(out[0].createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(out[0].quote).toBe('Great work!');
  });
});

describe('reviewsService.create', () => {
  it('defaults order to 0 and active to true', async () => {
    (db.review.create as ReturnType<typeof vi.fn>).mockResolvedValue(row);
    await reviewsService.create({ quote: 'Nice', authorName: 'Karla' });
    expect(db.review.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ order: 0, active: true }) }),
    );
  });
});

describe('reviewsService.update', () => {
  it('throws ReviewsError(404) when the review is missing', async () => {
    (db.review.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(reviewsService.update('nope', { active: false })).rejects.toBeInstanceOf(ReviewsError);
  });
});

describe('reviewsService.delete', () => {
  it('throws ReviewsError(404) when the review is missing', async () => {
    (db.review.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(reviewsService.delete('nope')).rejects.toBeInstanceOf(ReviewsError);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @studioflow/core test -- reviews`
Expected: FAIL — cannot find module `.` / `reviewsService`.

- [ ] **Step 3: Write the service**

Create `packages/core/src/reviews/index.ts`:

```ts
import { db } from '@studioflow/db';

// CRUD for client reviews shown on the marketing site. Like Budgets this is a light,
// non-localized list — no publish workflow, SEO, or versioning — just an ordered,
// toggleable set. One `quote` string is shown as-is on both the EN and AR sites.

export interface ReviewRecord {
  id: string;
  quote: string;
  authorName: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const SELECT = {
  id: true,
  quote: true,
  authorName: true,
  order: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function map(row: Record<string, unknown>): ReviewRecord {
  return {
    id: row.id as string,
    quote: row.quote as string,
    authorName: row.authorName as string,
    order: row.order as number,
    active: row.active as boolean,
    createdAt: (row.createdAt as Date).toISOString(),
    updatedAt: (row.updatedAt as Date).toISOString(),
  };
}

export class ReviewsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ReviewsError';
  }
}

export class ReviewsService {
  // Admin view — every review, ordered.
  async list(): Promise<ReviewRecord[]> {
    const rows = await db.review.findMany({ orderBy: [{ order: 'asc' }, { createdAt: 'asc' }], select: SELECT });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  // Public view — only active reviews, ordered.
  async listActive(): Promise<ReviewRecord[]> {
    const rows = await db.review.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: SELECT,
    });
    return rows.map((r) => map(r as unknown as Record<string, unknown>));
  }

  async getById(id: string): Promise<ReviewRecord | null> {
    const row = await db.review.findUnique({ where: { id }, select: SELECT });
    return row ? map(row as unknown as Record<string, unknown>) : null;
  }

  async create(input: {
    quote: string;
    authorName: string;
    order?: number;
    active?: boolean;
  }): Promise<ReviewRecord> {
    const row = await db.review.create({
      data: {
        quote: input.quote,
        authorName: input.authorName,
        order: input.order ?? 0,
        active: input.active ?? true,
      },
      select: SELECT,
    });
    return map(row as unknown as Record<string, unknown>);
  }

  async update(
    id: string,
    input: { quote?: string; authorName?: string; order?: number; active?: boolean },
  ): Promise<ReviewRecord> {
    const existing = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ReviewsError('Review not found', 'NOT_FOUND', 404);

    const data: Record<string, unknown> = {};
    if (input.quote !== undefined) data.quote = input.quote;
    if (input.authorName !== undefined) data.authorName = input.authorName;
    if (input.order !== undefined) data.order = input.order;
    if (input.active !== undefined) data.active = input.active;

    const row = await db.review.update({ where: { id }, data: data as never, select: SELECT });
    return map(row as unknown as Record<string, unknown>);
  }

  async delete(id: string): Promise<void> {
    const existing = await db.review.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new ReviewsError('Review not found', 'NOT_FOUND', 404);
    await db.review.delete({ where: { id } });
  }
}

export const reviewsService = new ReviewsService();
```

- [ ] **Step 4: Add the export subpath**

In `packages/core/package.json`, add to `"exports"` (after `"./budgets"`):

```json
    "./reviews": "./src/reviews/index.ts",
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @studioflow/core test -- reviews`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/reviews packages/core/package.json
git commit -m "feat(core): add ReviewsService"
```

---

### Task 4: Public read — `publicContent.listReviews()`

**Files:**
- Modify: `packages/core/src/public/index.ts` (add interface + method to the `publicContent` object)

**Interfaces:**
- Consumes: `db` from `@studioflow/db` (already imported in this file).
- Produces: `publicContent.listReviews(): Promise<ReviewCard[]>` where `ReviewCard = { id: string; quote: string; authorName: string }`. No locale argument — same result on both locales.

- [ ] **Step 1: Add the `ReviewCard` interface**

In `packages/core/src/public/index.ts`, add near the other `export interface` blocks (e.g. after `ProjectCard`):

```ts
export interface ReviewCard {
  id: string;
  quote: string;
  authorName: string;
}
```

- [ ] **Step 2: Add the `listReviews` method**

Inside the `export const publicContent = { ... }` object, add a method (e.g. right after `homepageSections`):

```ts
  // Client reviews for the marketing site. Not localized — the same active reviews render
  // on both /en and /ar, ordered by `order`.
  async listReviews(): Promise<ReviewCard[]> {
    const rows = await db.review.findMany({
      where: { active: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, quote: true, authorName: true },
    });
    return rows.map((r) => ({ id: r.id, quote: r.quote, authorName: r.authorName }));
  },
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @studioflow/core typecheck`
Expected: PASS (no type errors).

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/public/index.ts
git commit -m "feat(core): add publicContent.listReviews"
```

---

### Task 5: Admin API routes

**Files:**
- Create: `apps/admin/app/api/reviews/route.ts`
- Create: `apps/admin/app/api/reviews/[id]/route.ts`

**Interfaces:**
- Consumes: `reviewsService`, `ReviewsError` (`@studioflow/core/reviews`); `createReviewSchema`, `updateReviewSchema` (`@studioflow/validation/reviews`); `withValidation`, `parseAndValidate` (`@studioflow/validation`); `guardRoute`, `SessionError` (`../../../lib/session` / `../../../../lib/session`); `PERMISSIONS` (`@studioflow/types`).
- Produces: `GET`/`POST /api/reviews`, `PATCH`/`DELETE /api/reviews/[id]`.

- [ ] **Step 1: Create the collection route**

Create `apps/admin/app/api/reviews/route.ts`:

```ts
import { withValidation } from '@studioflow/validation';
import { createReviewSchema } from '@studioflow/validation/reviews';
import { reviewsService, ReviewsError } from '@studioflow/core/reviews';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ReviewsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

export const GET = async (request: Request): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const items = await reviewsService.list();
    return Response.json(items);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};

export const POST = withValidation(createReviewSchema, async (data, request) => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const review = await reviewsService.create(data);
    return Response.json(review, { status: 201 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
});
```

- [ ] **Step 2: Create the item route**

Create `apps/admin/app/api/reviews/[id]/route.ts`:

```ts
import { parseAndValidate } from '@studioflow/validation';
import { updateReviewSchema } from '@studioflow/validation/reviews';
import { reviewsService, ReviewsError } from '@studioflow/core/reviews';
import { PERMISSIONS } from '@studioflow/types';
import { guardRoute, SessionError } from '../../../../lib/session';

async function handleError(e: unknown): Promise<Response | null> {
  if (e instanceof SessionError) return Response.json({ error: e.message }, { status: 401 });
  if (e instanceof ReviewsError) return Response.json({ error: e.message }, { status: e.statusCode });
  return null;
}

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Ctx): Promise<Response> {
  try {
    const parsed = await parseAndValidate(updateReviewSchema, request);
    if (!parsed.ok) return parsed.response;
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const { id } = await params;
    const review = await reviewsService.update(id, parsed.data);
    return Response.json(review);
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
}

export const DELETE = async (request: Request, { params }: Ctx): Promise<Response> => {
  try {
    await guardRoute(request, PERMISSIONS.SETTINGS_MANAGE);
    const { id } = await params;
    await reviewsService.delete(id);
    return new Response(null, { status: 204 });
  } catch (e) {
    const err = await handleError(e);
    if (err) return err;
    throw e;
  }
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @studioflow/admin typecheck` (or `pnpm --filter admin typecheck` — match the admin package name in `apps/admin/package.json`)
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/app/api/reviews
git commit -m "feat(admin): add reviews CRUD API"
```

---

### Task 6: Admin Reviews page + nav entry

**Files:**
- Create: `apps/admin/app/(app)/reviews/page.tsx`
- Modify: `apps/admin/components/nav.ts` (add a `Reviews` nav item)

**Interfaces:**
- Consumes: `/api/reviews` endpoints (Task 5); `useAuth`, `useToast`, `PageHeader`, `Spinner`, `EmptyState`, `ConfirmDialog`, `Modal` (existing admin components, same imports as `budgets/page.tsx`).

- [ ] **Step 1: Add the nav entry**

In `apps/admin/components/nav.ts`, add to the `Content` group's `items` array (after the `Budgets` entry):

```ts
      { href: '/reviews', label: 'Reviews', perms: [PERMISSIONS.SETTINGS_MANAGE] },
```

- [ ] **Step 2: Create the page**

Create `apps/admin/app/(app)/reviews/page.tsx`:

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, ConfirmDialog, Modal } from '../../../components/ui';

interface Review {
  id: string;
  quote: string;
  authorName: string;
  order: number;
  active: boolean;
}

interface FormState {
  quote: string;
  authorName: string;
  order: string;
  active: boolean;
}

const EMPTY: FormState = { quote: '', authorName: '', order: '0', active: true };

export default function ReviewsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<Review[] | null>(null);
  const [editing, setEditing] = useState<Review | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Review | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    api<Review[]>('/api/reviews')
      .then(setItems)
      .catch(() => toast('Could not load reviews', 'error'));
  }, [api, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, order: String(items?.length ?? 0) });
  }

  function openEdit(r: Review) {
    setEditing(r);
    setForm({ quote: r.quote, authorName: r.authorName, order: String(r.order), active: r.active });
  }

  function closeForm() {
    setForm(null);
    setEditing(null);
  }

  async function save() {
    if (!form) return;
    if (!form.quote.trim()) {
      toast('Review text is required', 'error');
      return;
    }
    if (!form.authorName.trim()) {
      toast('Client name is required', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      quote: form.quote.trim(),
      authorName: form.authorName.trim(),
      order: Number.isFinite(parseInt(form.order, 10)) ? parseInt(form.order, 10) : 0,
      active: form.active,
    };
    try {
      if (editing) {
        await api(`/api/reviews/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast('Review updated');
      } else {
        await api('/api/reviews', { method: 'POST', body: JSON.stringify(payload) });
        toast('Review added');
      }
      closeForm();
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(r: Review) {
    try {
      await api(`/api/reviews/${r.id}`, { method: 'PATCH', body: JSON.stringify({ active: !r.active }) });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/reviews/${toDelete.id}`, { method: 'DELETE' });
      toast('Review deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Content" title="Reviews">
        <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
          Add review
        </button>
      </PageHeader>

      {items === null ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          hint="Add client reviews here and they appear in the reviews section on the site."
          action={
            <button type="button" className="btn btn-red btn-sm" onClick={openCreate}>
              Add review
            </button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {items.map((r) => (
            <li key={r.id} className={`panel flex flex-wrap items-start justify-between gap-3 rounded-xl p-4 ${r.active ? '' : 'opacity-60'}`}>
              <div className="min-w-0">
                <p className="text-white">“{r.quote}”</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-display font-semibold text-white">{r.authorName}</span>
                  {!r.active && <span className="chip">hidden</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(r)}>
                  {r.active ? 'Hide' : 'Show'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(r)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <Modal title={editing ? 'Edit review' : 'Add review'} onClose={closeForm}>
          <div className="grid gap-4">
            <div className="field">
              <label htmlFor="r-quote">Review text</label>
              <textarea id="r-quote" className="input" rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="Impressed by the professionalism and attention to detail." />
              <p className="mt-1 text-[12px] text-muted">Shown as-is on both the English and Arabic site.</p>
            </div>
            <div className="field">
              <label htmlFor="r-name">Client name</label>
              <input id="r-name" className="input" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Guy Hawkins" />
            </div>
            <div className="flex items-end gap-4">
              <div className="field w-24">
                <label htmlFor="r-order">Order</label>
                <input id="r-order" type="number" className="input" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 pb-2.5 text-sm text-white">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Shown on site
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeForm} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="btn btn-red btn-sm" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add review'}
            </button>
          </div>
        </Modal>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete review?"
          body={`The review by "${toDelete.authorName}" will be permanently removed.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @studioflow/admin typecheck`
Expected: PASS.

- [ ] **Step 4: Verify in the running admin app**

Start the admin app (`pnpm --filter @studioflow/admin dev`), log in, open `/reviews`. Add a review, toggle Hide/Show, edit it, delete it. Confirm each toast + list update works.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/(app)/reviews/page.tsx apps/admin/components/nav.ts
git commit -m "feat(admin): add Reviews manager page and nav entry"
```

---

### Task 7: Public reviews section component

**Files:**
- Create: `apps/web/components/sections/reviews.tsx`

**Interfaces:**
- Consumes: `publicContent.listReviews()` (Task 4); `getTranslations` (`next-intl/server`); `Reveal` (`../reveal`); `type Locale` (`@studioflow/core/public`).
- Produces: `export async function Reviews({ locale, config }: { locale: Locale; config?: { title?: string; maxItems?: number } })`. Renders `null` when there are no active reviews. Section wrapper carries `id="reviews"`.

- [ ] **Step 1: Create the section component**

Create `apps/web/components/sections/reviews.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { publicContent, type Locale } from '@studioflow/core/public';
import { Reveal } from '../reveal';

// Client reviews section (see docs/image.png): quote mark → review text → client name.
// Reviews are not localized — the same list renders on both /en and /ar. The section is
// the scroll target (id="reviews") for the hero "reviews" button.
export async function Reviews({
  locale: _locale,
  config = {},
}: {
  locale: Locale;
  config?: { title?: string; maxItems?: number };
}) {
  const ts = await getTranslations('sections');
  let reviews = await publicContent.listReviews();
  if (reviews.length === 0) return null;
  if (config.maxItems && config.maxItems > 0) reviews = reviews.slice(0, config.maxItems);
  const heading = config.title?.trim() || ts('testimonialsHeading');

  return (
    <section id="reviews" className="relative z-[2] scroll-mt-24 bg-ink py-[clamp(44px,6vw,88px)]">
      <div className="wrap">
        <Reveal className="mb-[clamp(36px,5vw,64px)] flex flex-col gap-3.5">
          <p className="eyebrow">{ts('testimonialsEyebrow')}</p>
          <h2 className="text-[clamp(32px,5.5vw,72px)] text-fg-strong">{heading}</h2>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.id} delay={i * 0.06}>
              <figure className="flex h-full flex-col gap-5 rounded-2xl border border-line bg-white/[0.03] p-7">
                <span aria-hidden="true" className="font-display text-6xl leading-none text-red">“</span>
                <blockquote className="text-[clamp(17px,1.8vw,21px)] leading-relaxed text-fg-strong">
                  {r.quote}
                </blockquote>
                <figcaption className="mt-auto font-display font-semibold text-fg-strong">
                  {r.authorName}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @studioflow/web typecheck` (match the web package name in `apps/web/package.json`)
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/sections/reviews.tsx
git commit -m "feat(web): add reviews section component"
```

---

### Task 8: Wire reviews into homepage + hero "reviews" button

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx` (render `Reviews` in `TESTIMONIALS` case + `DefaultHome`)
- Modify: `apps/web/components/sections/hero.tsx` (add hide-when-empty `reviewsCtaText` button)
- Modify: `packages/validation/src/homepage.ts` (allow `reviewsCtaText` in `heroConfig`)
- Modify: `apps/admin/app/(app)/homepage/page.tsx` (add the `reviewsCtaText` field to the HERO editor)

**Interfaces:**
- Consumes: `Reviews` (Task 7); `HeroConfig` gains `reviewsCtaText?: string`.

- [ ] **Step 1: Render Reviews on the homepage**

In `apps/web/app/[locale]/page.tsx`:

1. Add the import near the other section imports:

```tsx
import { Reviews } from '../../components/sections/reviews';
```

2. In `renderSection`, replace the `TESTIMONIALS` behavior by adding a case above `default`:

```tsx
    case 'TESTIMONIALS':
      return <Reviews key={key} locale={locale} config={config} />;
```

3. In `DefaultHome`, add `<Reviews locale={locale} />` between `<Faq />` and `<CtaBanner />`:

```tsx
      <Faq />
      <Reviews locale={locale} />
      <CtaBanner />
```

Also update the stale comment on `renderSection` (line ~18) from "Unknown/TESTIMONIALS types render nothing" to "Unknown types render nothing".

- [ ] **Step 2: Add the hero button (hide-when-empty)**

In `apps/web/components/sections/hero.tsx`:

1. Add `reviewsCtaText` to `HeroConfig`:

```tsx
interface HeroConfig {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaLink?: string;
  reviewsCtaText?: string;
  backgroundUrl?: string | null;
}
```

2. Compute the trimmed label alongside the other config reads (after the `ctaLink` line):

```tsx
  const reviewsCta = config.reviewsCtaText?.trim() ?? '';
```

3. Inside the button row `motion.div` (the one with `className="mt-9 flex flex-wrap items-center gap-7"`), add a second button after the existing `CmsLink`. It is an in-page anchor with a smooth scroll and only renders when a label is set:

```tsx
          <CmsLink href={ctaLink} className="btn btn-red rounded-[2px]" cursor="Go">
            {ctaText}
          </CmsLink>
          {reviewsCta ? (
            <a
              href="#reviews"
              className="btn btn-ghost rounded-[2px]"
              data-cursor="Read"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {reviewsCta}
            </a>
          ) : null}
```

(Note: `hero.tsx` is already a `'use client'` component, so the `onClick` handler is valid. If the `btn-ghost` class does not exist on the web app, use `btn` — verify against `apps/web`'s global styles.)

- [ ] **Step 3: Allow `reviewsCtaText` in the HERO config schema**

In `packages/validation/src/homepage.ts`, add to `heroConfig` (after the `ctaLink` line):

```ts
  reviewsCtaText: safe(60).optional(),
```

- [ ] **Step 4: Add the admin HERO editor field**

In `apps/admin/app/(app)/homepage/page.tsx`, inside the `section.type === 'HERO'` block (after the `ctaLink` field, ~line 288):

```tsx
            <CfgText cfg={cfg} setK={setK} k="reviewsCtaText" label="Reviews button text (leave empty to hide)" />
```

- [ ] **Step 5: Typecheck web, admin, and validation**

Run:

```bash
pnpm --filter @studioflow/web typecheck && pnpm --filter @studioflow/admin typecheck && pnpm --filter @studioflow/validation typecheck
```

Expected: PASS for all three.

- [ ] **Step 6: End-to-end verification in the running apps**

1. In the admin app → Homepage → configure the HERO section → set "Reviews button text" (e.g. "Read reviews") → save.
2. In the admin app → Reviews → add 2–3 reviews (active).
3. Load the web app homepage (`/en` and `/ar`):
   - The hero shows the "Read reviews" button next to the CTA.
   - Clicking it smooth-scrolls to the reviews section.
   - The reviews section shows the cards (quote → text → name), identical on both locales.
   - Clear the "Reviews button text" in admin → save → reload: the hero button is gone.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/[locale]/page.tsx apps/web/components/sections/hero.tsx packages/validation/src/homepage.ts apps/admin/app/(app)/homepage/page.tsx
git commit -m "feat(web): wire reviews section into homepage and add hero reviews button"
```

---

### Task 9 (optional): Seed sample reviews

**Files:**
- Modify: `packages/db/src/seed-22studio.ts` (add a few `db.review.create` calls)

**Interfaces:**
- Consumes: `db` from `@studioflow/db`.

- [ ] **Step 1: Add sample reviews to the seed**

In `packages/db/src/seed-22studio.ts`, in the seeding flow, add (guarded so re-runs don't duplicate — mirror how the file guards other entities; if it uses upserts/counts, follow that pattern):

```ts
  const reviewCount = await db.review.count();
  if (reviewCount === 0) {
    await db.review.createMany({
      data: [
        { quote: 'Impressed by the professionalism and attention to detail.', authorName: 'Guy Hawkins', order: 0 },
        { quote: 'A seamless experience from start to finish. Highly recommend!', authorName: 'Karla Lynn', order: 1 },
        { quote: 'Reliable and trustworthy. Made my life so much easier!', authorName: 'Jane Cooper', order: 2 },
      ],
    });
  }
```

(Confirm `db.review.createMany` matches the file's style; if the seed uses `create` in a loop elsewhere, follow that instead.)

- [ ] **Step 2: Run the seed**

Run: `pnpm --filter @studioflow/db seed` (or the 22studio-specific seed script if separate — check `packages/db/package.json` scripts and `seed-22studio.ts`'s entry).
Expected: 3 reviews inserted; re-running does not duplicate them.

- [ ] **Step 3: Commit**

```bash
git add packages/db/src/seed-22studio.ts
git commit -m "chore(db): seed sample client reviews"
```

---

## Self-Review

**Spec coverage:**
- Reviews section styled like `docs/image.png` (quote → text → name) → Task 7. ✓
- Hero "reviews" button, admin-editable label, hide-when-empty, scrolls to section → Task 8. ✓
- Admin add / edit / reorder (via `order`) / hide (`active`) / delete → Tasks 5–6. ✓
- One quote shown on both EN & AR, not localized/split → Tasks 1–4, 7 (no locale filtering). ✓
- Lightweight Budget-style model, existing `Testimonial` untouched → Task 1. ✓

**Placeholder scan:** No TBD/TODO; every code step includes full code. Two explicit "verify against your app" notes (admin package name, `btn-ghost` class) are real environment checks, not placeholders.

**Type consistency:** `ReviewRecord`/`ReviewCard` fields (`quote`, `authorName`, `order`, `active`) are consistent across service, public read, API, admin page, and section. Schema field names (`quote`, `authorName`) match the Prisma model and Zod schemas. `reviewsService`, `ReviewsError`, `createReviewSchema`, `updateReviewSchema`, `publicContent.listReviews`, `Reviews`, `reviewsCtaText` names are used identically wherever referenced.

**Note for the implementer:** Confirm the exact pnpm package names (`@studioflow/web`, `@studioflow/admin`) from each app's `package.json` before running `--filter` commands; adjust if they differ.
```
