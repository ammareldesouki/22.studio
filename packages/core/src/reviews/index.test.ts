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
