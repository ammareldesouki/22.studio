'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner } from '../../../components/ui';
import { MediaField } from '../../../components/form';

interface Settings {
  siteName: string;
  logoId: string | null;
  faviconId: string | null;
  socialLinks: Record<string, string>;
  seoDefaults: Record<string, unknown> | null;
  contact: Record<string, string> | null;
  version: number;
}

const SOCIALS = ['instagram', 'youtube', 'vimeo', 'linkedin', 'tiktok', 'x'];

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

    const payload: Record<string, unknown> = {
      siteName: data.siteName.trim(),
      logoId: data.logoId,
      faviconId: data.faviconId,
      socialLinks,
      contact: contactClean,
      seoDefaults,
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
      </div>
    </div>
  );
}
