import { describe, it, expect } from 'vitest';
import { updateSettingsSchema } from './settings';

describe('updateSettingsSchema — no raw-HTML editing path (SC-006)', () => {
  it('accepts clean settings', () => {
    const r = updateSettingsSchema.safeParse({
      siteName: '22 Studio',
      socialLinks: { instagram: 'https://instagram.com/22studi' },
      seoDefaults: { title: 'Creative Video Studio', canonicalUrl: 'https://22studio.example' },
      contact: { email: 'real22studio@gmail.com', phone: '+20 108 061 5075' },
      version: 1,
    });
    expect(r.success).toBe(true);
  });

  it('rejects HTML in siteName (renders site-wide)', () => {
    const r = updateSettingsSchema.safeParse({ siteName: '<script>alert(1)</script>', version: 1 });
    expect(r.success).toBe(false);
  });

  it('rejects HTML in seoDefaults.metaDescription', () => {
    const r = updateSettingsSchema.safeParse({
      seoDefaults: { metaDescription: '<img src=x onerror=alert(1)>' },
      version: 1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects a javascript: canonicalUrl', () => {
    const r = updateSettingsSchema.safeParse({
      seoDefaults: { canonicalUrl: 'javascript:alert(1)' },
      version: 1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects a javascript: social link value', () => {
    const r = updateSettingsSchema.safeParse({
      socialLinks: { x: 'javascript:alert(1)' },
      version: 1,
    });
    expect(r.success).toBe(false);
  });

  it('allows an ampersand in normal copy', () => {
    const r = updateSettingsSchema.safeParse({ siteName: 'Editing & Direction', version: 1 });
    expect(r.success).toBe(true);
  });
});

describe('updateSettingsSchema — analyticsIds', () => {
  it('accepts tracking ids alongside their boolean switches', () => {
    const r = updateSettingsSchema.safeParse({
      analyticsIds: {
        ga4MeasurementId: 'G-ABC1234567',
        ga4Enabled: true,
        metaPixelId: '4068035563505322',
        metaPixelEnabled: false,
      },
      version: 1,
    });
    expect(r.success).toBe(true);
  });

  it('accepts switches on their own, so tracking can be turned off without an id', () => {
    const r = updateSettingsSchema.safeParse({
      analyticsIds: { ga4Enabled: false, metaPixelEnabled: false },
      version: 1,
    });
    expect(r.success).toBe(true);
  });

  it('still saves a malformed id — the admin warns, it does not block', () => {
    const r = updateSettingsSchema.safeParse({
      analyticsIds: { ga4MeasurementId: 'G-abc', metaPixelId: '12ab34' },
      version: 1,
    });
    expect(r.success).toBe(true);
  });

  it('rejects HTML smuggled into a tracking id', () => {
    const r = updateSettingsSchema.safeParse({
      analyticsIds: { ga4MeasurementId: "G-AAAA'</script><script>alert(1)</script>" },
      version: 1,
    });
    expect(r.success).toBe(false);
  });

  it('rejects a non-boolean switch', () => {
    const r = updateSettingsSchema.safeParse({ analyticsIds: { ga4Enabled: 'true' }, version: 1 });
    expect(r.success).toBe(false);
  });
});
