import { describe, it, expect } from 'vitest';
import { validateSectionConfig } from './homepage';

describe('validateSectionConfig — raw HTML rejection (FR-019 / SC-006)', () => {
  it('accepts clean plain-text config', () => {
    const r = validateSectionConfig('HERO', {
      headline: 'Your story deserves a video that hits',
      subheadline: 'We turn briefs into content people cannot scroll past.',
      ctaText: 'Start your project',
      ctaLink: 'https://22studio.example/contact',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a <script> tag in a headline', () => {
    const r = validateSectionConfig('HERO', { headline: '<script>alert(document.cookie)</script>' });
    expect(r.success).toBe(false);
  });

  it('rejects an onerror handler injected into an FAQ answer', () => {
    const r = validateSectionConfig('FAQ', {
      items: [{ question: 'Is it safe?', answer: '<img src=x onerror=alert(1)>' }],
    });
    expect(r.success).toBe(false);
  });

  it('rejects any HTML tag in CTA copy', () => {
    const r = validateSectionConfig('CTA', { headline: 'Ready?', buttonText: '<b>Go</b>' });
    expect(r.success).toBe(false);
  });

  it('rejects HTML entities used to smuggle markup', () => {
    const r = validateSectionConfig('HERO', { headline: '&lt;script&gt;alert(1)&lt;/script&gt;' });
    expect(r.success).toBe(false);
  });

  it('rejects a javascript: link', () => {
    const r = validateSectionConfig('HERO', { headline: 'ok', ctaLink: 'javascript:alert(1)' });
    expect(r.success).toBe(false);
  });

  it('rejects HTML in stats item labels', () => {
    const r = validateSectionConfig('STATS', {
      items: [{ label: '<span>Views</span>', value: '4.2M' }],
    });
    expect(r.success).toBe(false);
  });

  it('allows ampersands in normal copy (not treated as HTML)', () => {
    const r = validateSectionConfig('SERVICES', { title: 'Editing & Creative Direction' });
    expect(r.success).toBe(true);
  });

  it('keeps an edited hero eyebrow/tagline', () => {
    const r = validateSectionConfig('HERO', { eyebrow: 'Creative Video Studio — Editing · AI Visuals' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.eyebrow).toBe('Creative Video Studio — Editing · AI Visuals');
  });

  it('keeps an empty hero eyebrow as "" (the admin hiding the tagline)', () => {
    const r = validateSectionConfig('HERO', { eyebrow: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.eyebrow).toBe('');
  });
});
