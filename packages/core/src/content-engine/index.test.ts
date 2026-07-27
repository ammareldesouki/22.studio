import { describe, it, expect } from 'vitest';
import { applyTransition, shouldStampPublishedAt, slugify, assertVersionedUpdate, ContentEngineError } from '.';

describe('content-engine', () => {
  describe('applyTransition', () => {
    it('DRAFT → publish → PUBLISHED', () => {
      expect(applyTransition('DRAFT', 'publish')).toBe('PUBLISHED');
    });

    it('PUBLISHED → archive → ARCHIVED', () => {
      expect(applyTransition('PUBLISHED', 'archive')).toBe('ARCHIVED');
    });

    it('PUBLISHED → unpublish → DRAFT', () => {
      expect(applyTransition('PUBLISHED', 'unpublish')).toBe('DRAFT');
    });

    it('ARCHIVED → restore → DRAFT', () => {
      expect(applyTransition('ARCHIVED', 'restore')).toBe('DRAFT');
    });

    it('throws on invalid transition', () => {
      expect(() => applyTransition('DRAFT', 'archive')).toThrow(ContentEngineError);
    });
  });

  describe('shouldStampPublishedAt', () => {
    it('true when transitioning from non-published to published', () => {
      expect(shouldStampPublishedAt('DRAFT', 'PUBLISHED')).toBe(true);
    });

    it('false when already published', () => {
      expect(shouldStampPublishedAt('PUBLISHED', 'PUBLISHED')).toBe(false);
    });
  });

  describe('slugify', () => {
    it('lowercases and hyphenates', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Project: "Awesome" [2024]!')).toBe('project-awesome-2024');
    });

    it('collapses multiple hyphens', () => {
      expect(slugify('foo   bar')).toBe('foo-bar');
    });

    it('folds diacritics', () => {
      expect(slugify('Café Résumé')).toBe('cafe-resume');
    });

    it('never returns an empty slug for non-Latin titles', () => {
      const s = slugify('مشروع');
      expect(s.length).toBeGreaterThan(0);
      expect(s).toMatch(/^[a-z0-9-]+$/);
    });

    it('same non-Latin title yields the same fallback slug', () => {
      expect(slugify('مشروع')).toBe(slugify('مشروع'));
    });
  });

  describe('assertVersionedUpdate', () => {
    it('passes when the conditional update affected a row', () => {
      expect(() => assertVersionedUpdate(1)).not.toThrow();
    });

    it('throws a version conflict when 0 rows were updated', () => {
      expect(() => assertVersionedUpdate(0)).toThrow(ContentEngineError);
    });
  });
});
