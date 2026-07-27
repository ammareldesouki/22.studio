import { describe, it, expect } from 'vitest';
import { buildPageMeta, buildPageResponse, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError, AppError } from '.';

describe('shared', () => {
  describe('buildPageMeta', () => {
    const makeItem = (id: string, date: Date) => ({ id, createdAt: date });

    it('returns cursor for items', () => {
      const items = [makeItem('1', new Date('2024-01-01')), makeItem('2', new Date('2024-01-02'))];
      const meta = buildPageMeta(items, 10);
      expect(meta.cursor).toContain('2024-01-02');
      expect(meta.hasMore).toBe(false);
    });

    it('detects hasMore when items exceed limit', () => {
      const items = [makeItem('1', new Date()), makeItem('2', new Date()), makeItem('3', new Date())];
      const meta = buildPageMeta(items, 2);
      expect(meta.hasMore).toBe(true);
    });
  });

  describe('buildPageResponse', () => {
    it('slices items when hasMore is true', () => {
      const items = [
        { id: '1', createdAt: new Date('2024-01-01') },
        { id: '2', createdAt: new Date('2024-01-02') },
        { id: '3', createdAt: new Date('2024-01-03') },
      ];
      const page = buildPageResponse(items, 2);
      expect(page.items).toHaveLength(2);
      expect(page.meta.hasMore).toBe(true);
    });
  });

  describe('error classes', () => {
    it('ConflictError has 409 status', () => {
      const err = new ConflictError('test');
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(409);
      expect(err.code).toBe('CONFLICT');
    });

    it('ForbiddenError has 403 status', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
    });

    it('NotFoundError has 404 status', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
    });

    it('UnauthorizedError has 401 status', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
    });

    it('ValidationError has 422 status', () => {
      const err = new ValidationError();
      expect(err.statusCode).toBe(422);
    });
  });
});
