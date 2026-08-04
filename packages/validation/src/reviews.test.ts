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
