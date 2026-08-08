import { describe, it, expect } from 'vitest';
import { resolveAnalytics } from '../lib/analytics';

const ga4 = (over: Record<string, unknown> = {}) => ({ ga4Enabled: true, ga4MeasurementId: 'G-ABC1234567', ...over });
const pixel = (over: Record<string, unknown> = {}) => ({ metaPixelEnabled: true, metaPixelId: '4068035563505322', ...over });

describe('resolveAnalytics — the toggle', () => {
  it('emits an id when enabled and well-formed', () => {
    expect(resolveAnalytics(ga4()).ga4Id).toBe('G-ABC1234567');
    expect(resolveAnalytics(pixel()).metaPixelId).toBe('4068035563505322');
  });

  it('emits nothing when the switch is off, even with a valid id', () => {
    expect(resolveAnalytics(ga4({ ga4Enabled: false })).ga4Id).toBeNull();
    expect(resolveAnalytics(pixel({ metaPixelEnabled: false })).metaPixelId).toBeNull();
  });

  it('emits nothing when the switch key is absent', () => {
    expect(resolveAnalytics({ ga4MeasurementId: 'G-ABC1234567' }).ga4Id).toBeNull();
    expect(resolveAnalytics({ metaPixelId: '4068035563505322' }).metaPixelId).toBeNull();
  });

  it('requires a real boolean — a truthy string must not enable tracking', () => {
    expect(resolveAnalytics(ga4({ ga4Enabled: 'true' })).ga4Id).toBeNull();
    expect(resolveAnalytics(ga4({ ga4Enabled: 1 })).ga4Id).toBeNull();
    expect(resolveAnalytics(pixel({ metaPixelEnabled: 'false' })).metaPixelId).toBeNull();
  });

  it('resolves the two providers independently', () => {
    const r = resolveAnalytics({ ...ga4({ ga4Enabled: false }), ...pixel() });
    expect(r.ga4Id).toBeNull();
    expect(r.metaPixelId).toBe('4068035563505322');
  });
});

describe('resolveAnalytics — id format', () => {
  it('emits nothing for a blank or whitespace id', () => {
    expect(resolveAnalytics(ga4({ ga4MeasurementId: '' })).ga4Id).toBeNull();
    expect(resolveAnalytics(ga4({ ga4MeasurementId: '   ' })).ga4Id).toBeNull();
    expect(resolveAnalytics(pixel({ metaPixelId: '' })).metaPixelId).toBeNull();
  });

  it('trims surrounding whitespace from a pasted id', () => {
    expect(resolveAnalytics(ga4({ ga4MeasurementId: '  G-ABC1234567  ' })).ga4Id).toBe('G-ABC1234567');
    expect(resolveAnalytics(pixel({ metaPixelId: ' 4068035563505322\n' })).metaPixelId).toBe('4068035563505322');
  });

  it('rejects malformed GA4 ids', () => {
    for (const id of ['G-abc', 'G-', 'ABC1234567', 'UA-12345-6', 'G-abc1234567', 'G ABC1234567']) {
      expect(resolveAnalytics(ga4({ ga4MeasurementId: id })).ga4Id, id).toBeNull();
    }
  });

  it('rejects non-numeric or wrong-length pixel ids', () => {
    for (const id of ['12ab34', '123', '40680355635053221234567890', 'G-ABC1234567', '406803556350532.2']) {
      expect(resolveAnalytics(pixel({ metaPixelId: id })).metaPixelId, id).toBeNull();
    }
  });

  it('rejects non-string ids', () => {
    expect(resolveAnalytics(ga4({ ga4MeasurementId: 123 })).ga4Id).toBeNull();
    expect(resolveAnalytics(pixel({ metaPixelId: 4068035563505322 })).metaPixelId).toBeNull();
    expect(resolveAnalytics(pixel({ metaPixelId: null })).metaPixelId).toBeNull();
  });
});

describe('resolveAnalytics — script injection is impossible', () => {
  // These are the payloads that matter: the resolved value is interpolated verbatim into a
  // <script> body and a URL, so anything that escapes the id pattern must resolve to null.
  const payloads = [
    "G-AAAA'</script><script>alert(1)</script>",
    "G-AAAA');alert(1);gtag('config','G-BBBB",
    '123"/><img src=x onerror=alert(1)>',
    '123&ev=Purchase&value=999',
    'G-AAAA\\u0027',
    "4068035563505322'",
    '<script>alert(1)</script>',
    'javascript:alert(1)',
  ];

  it('never emits a value carrying script-breaking characters', () => {
    for (const p of payloads) {
      expect(resolveAnalytics(ga4({ ga4MeasurementId: p })).ga4Id, p).toBeNull();
      expect(resolveAnalytics(pixel({ metaPixelId: p })).metaPixelId, p).toBeNull();
    }
  });

  it('any emitted id contains only allowlisted characters', () => {
    const r = resolveAnalytics({ ...ga4(), ...pixel() });
    for (const v of [r.ga4Id, r.metaPixelId]) {
      expect(v).not.toBeNull();
      expect(v ?? '').toMatch(/^[A-Z0-9-]+$/);
    }
  });
});

describe('resolveAnalytics — malformed input', () => {
  it('handles null, undefined, arrays and primitives without throwing', () => {
    for (const input of [null, undefined, [], 'string', 42, true]) {
      expect(resolveAnalytics(input)).toEqual({ ga4Id: null, metaPixelId: null });
    }
  });

  it('handles an empty settings blob', () => {
    expect(resolveAnalytics({})).toEqual({ ga4Id: null, metaPixelId: null });
  });
});
