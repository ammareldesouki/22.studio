'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner } from '../../../components/ui';
import { MediaField } from '../../../components/form';
import { GA4_ID_RE, META_PIXEL_ID_RE } from '@studioflow/validation/settings';

interface Settings {
  siteName: string;
  logoId: string | null;
  faviconId: string | null;
  socialLinks: Record<string, string>;
  seoDefaults: Record<string, unknown> | null;
  contact: Record<string, string> | null;
  analyticsIds: Record<string, string | boolean> | null;
  version: number;
}

const SOCIALS = ['instagram', 'youtube', 'vimeo', 'linkedin', 'tiktok', 'x'];

// Non-blocking format hints. The same patterns gate rendering on the public site, so a field
// showing a warning is a field whose script will not load — the warning is a real prediction.
const GA4_WARNING = 'Doesn’t look like a GA4 ID (G-XXXXXXXXXX). It will still be saved, but tracking won’t load until it’s corrected.';
const PIXEL_WARNING = 'A Meta Pixel ID is digits only. It will still be saved, but tracking won’t load until it’s corrected.';

function formatWarning(value: string, re: RegExp, message: string): string | null {
  const v = value.trim();
  return v && !re.test(v) ? message : null;
}

export default function SettingsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Settings>('/api/settings')
      .then(setData)
      .catch(() => toast('Could not load settings', 'error'));
  }, [api, toast]);

  if (!data) return <Spinner />;

  const seo = (data.seoDefaults ?? {}) as Record<string, string>;
  const contact = data.contact ?? {};
  const analytics = data.analyticsIds ?? {};
  const ga4Id = (analytics.ga4MeasurementId as string) ?? '';
  const pixelId = (analytics.metaPixelId as string) ?? '';

  function patch(next: Partial<Settings>) {
    setData((d) => (d ? { ...d, ...next } : d));
  }

  async function save() {
    if (!data) return;
    setBusy(true);
    const socialLinks: Record<string, string> = {};
    for (const [k, v] of Object.entries(data.socialLinks)) if (v?.trim()) socialLinks[k] = v.trim();
    const contactClean: Record<string, string> = {};
    for (const [k, v] of Object.entries(contact)) if (v?.trim()) contactClean[k] = v.trim();
    const seoDefaults: Record<string, string> = {};
    if (seo.title?.trim()) seoDefaults.title = seo.title.trim();
    if (seo.metaDescription?.trim()) seoDefaults.metaDescription = seo.metaDescription.trim();

    // Ids are omitted when blank (as elsewhere on this page), but the switches are always sent —
    // dropping them would make "turn tracking off" indistinguishable from "leave it as it was".
    const analyticsIds: Record<string, string | boolean> = {
      ga4Enabled: analytics.ga4Enabled === true,
      metaPixelEnabled: analytics.metaPixelEnabled === true,
    };
    if (ga4Id.trim()) analyticsIds.ga4MeasurementId = ga4Id.trim();
    if (pixelId.trim()) analyticsIds.metaPixelId = pixelId.trim();

    const payload: Record<string, unknown> = {
      siteName: data.siteName.trim(),
      logoId: data.logoId,
      faviconId: data.faviconId,
      socialLinks,
      contact: contactClean,
      seoDefaults,
      analyticsIds,
      version: data.version,
    };
    try {
      const updated = await api<Settings>('/api/settings', { method: 'PATCH', body: JSON.stringify(payload) });
      setData(updated);
      toast('Settings saved');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Studio" title="Settings">
        <button type="button" className="btn btn-red" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </PageHeader>

      <div className="grid max-w-3xl gap-5">
        <section className="panel rounded-xl p-6">
          <h2 className="mb-4 text-base">Brand</h2>
          <div className="flex flex-col gap-4">
            <div className="field">
              <label htmlFor="siteName">Site name</label>
              <input id="siteName" className="input" value={data.siteName} onChange={(e) => patch({ siteName: e.target.value })} />
            </div>
            <MediaField label="Logo" value={data.logoId} onChange={(id) => patch({ logoId: id })} allow="image" />
            <MediaField label="Favicon (browser tab icon)" value={data.faviconId} onChange={(id) => patch({ faviconId: id })} allow="image" />
          </div>
        </section>

        <section className="panel rounded-xl p-6">
          <h2 className="mb-4 text-base">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input id="c-email" type="email" className="input" value={contact.email ?? ''} onChange={(e) => patch({ contact: { ...contact, email: e.target.value } })} />
            </div>
            <div className="field">
              <label htmlFor="c-phone">Phone</label>
              <input id="c-phone" className="input" value={contact.phone ?? ''} onChange={(e) => patch({ contact: { ...contact, phone: e.target.value } })} />
            </div>
            <div className="field sm:col-span-2">
              <label htmlFor="c-addr">Address</label>
              <input id="c-addr" className="input" value={contact.address ?? ''} onChange={(e) => patch({ contact: { ...contact, address: e.target.value } })} />
            </div>
          </div>
        </section>

        <section className="panel rounded-xl p-6">
          <h2 className="mb-4 text-base">Social links</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIALS.map((key) => (
              <div className="field" key={key}>
                <label htmlFor={`s-${key}`} className="capitalize">
                  {key}
                </label>
                <input
                  id={`s-${key}`}
                  className="input"
                  placeholder="https://…"
                  value={data.socialLinks[key] ?? ''}
                  onChange={(e) => patch({ socialLinks: { ...data.socialLinks, [key]: e.target.value } })}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="panel rounded-xl p-6">
          <h2 className="mb-4 text-base">SEO defaults</h2>
          <div className="flex flex-col gap-4">
            <div className="field">
              <label htmlFor="seo-t">Default meta title</label>
              <input id="seo-t" className="input" value={seo.title ?? ''} onChange={(e) => patch({ seoDefaults: { ...seo, title: e.target.value } })} />
            </div>
            <div className="field">
              <label htmlFor="seo-d">Default meta description</label>
              <textarea id="seo-d" className="input" rows={2} value={seo.metaDescription ?? ''} onChange={(e) => patch({ seoDefaults: { ...seo, metaDescription: e.target.value } })} />
            </div>
          </div>
        </section>

        <section className="panel rounded-xl p-6">
          <h2 className="mb-4 text-base">Analytics</h2>
          <p className="mb-4 text-[13px] text-muted">
            Tracking scripts load on every page of the site, in both English and Arabic. A tracking ID only takes effect once its
            switch below is turned on.
          </p>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="field">
                <label htmlFor="ga4-id">Google Analytics (GA4) Measurement ID</label>
                <input
                  id="ga4-id"
                  className="input"
                  placeholder="G-XXXXXXXXXX"
                  value={ga4Id}
                  onChange={(e) => patch({ analyticsIds: { ...analytics, ga4MeasurementId: e.target.value } })}
                />
                <p className="text-[12px] text-muted">Find it in Google Analytics → Admin → Data Streams → your web stream.</p>
                {formatWarning(ga4Id, GA4_ID_RE, GA4_WARNING) && (
                  <p className="text-[12px] text-amber-400">{formatWarning(ga4Id, GA4_ID_RE, GA4_WARNING)}</p>
                )}
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={analytics.ga4Enabled === true}
                  onChange={(e) => patch({ analyticsIds: { ...analytics, ga4Enabled: e.target.checked } })}
                  className="accent-red"
                />
                Enable Google Analytics tracking
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="field">
                <label htmlFor="meta-pixel-id">Meta Pixel ID</label>
                <input
                  id="meta-pixel-id"
                  className="input"
                  placeholder="e.g. 1234567890123456"
                  value={pixelId}
                  onChange={(e) => patch({ analyticsIds: { ...analytics, metaPixelId: e.target.value } })}
                />
                <p className="text-[12px] text-muted">Find it in Meta Events Manager → Data Sources → your pixel.</p>
                {formatWarning(pixelId, META_PIXEL_ID_RE, PIXEL_WARNING) && (
                  <p className="text-[12px] text-amber-400">{formatWarning(pixelId, META_PIXEL_ID_RE, PIXEL_WARNING)}</p>
                )}
              </div>
              <label className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={analytics.metaPixelEnabled === true}
                  onChange={(e) => patch({ analyticsIds: { ...analytics, metaPixelEnabled: e.target.checked } })}
                  className="accent-red"
                />
                Enable Meta Pixel tracking
              </label>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
