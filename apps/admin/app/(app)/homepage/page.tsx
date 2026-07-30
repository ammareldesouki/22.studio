'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../components/auth-provider';
import { useToast } from '../../../components/toast';
import { PageHeader, Spinner, EmptyState, Modal, ConfirmDialog } from '../../../components/ui';
import { MediaField } from '../../../components/form';

interface Section {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
  version: number;
}

const SECTION_TYPES = ['HERO', 'SERVICES', 'PROJECTS', 'CLIENTS', 'STATS', 'TESTIMONIALS', 'FAQ', 'CTA', 'BEFORE_AFTER', 'PROCESS'] as const;

export default function HomepagePage() {
  const { api } = useAuth();
  const toast = useToast();
  const [sections, setSections] = useState<Section[] | null>(null);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState<string>('HERO');
  const [editing, setEditing] = useState<Section | null>(null);
  const [toDelete, setToDelete] = useState<Section | null>(null);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(() => {
    setSections(null);
    api<Section[]>(`/api/homepage?locale=${lang}`)
      .then(setSections)
      .catch(() => toast('Could not load homepage', 'error'));
  }, [api, toast, lang]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addSection() {
    setAdding(true);
    try {
      await api('/api/homepage/sections', { method: 'POST', body: JSON.stringify({ type: addType, locale: lang }) });
      toast('Section added');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add', 'error');
    } finally {
      setAdding(false);
    }
  }

  async function toggle(s: Section) {
    try {
      await api(`/api/homepage/sections/${s.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !s.enabled, version: s.version }),
      });
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  }

  async function move(i: number, dir: -1 | 1) {
    if (!sections) return;
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const ordered = [...sections];
    const a = ordered[i];
    const b = ordered[j];
    if (!a || !b) return;
    ordered[i] = b;
    ordered[j] = a;
    setSections(ordered);
    try {
      await api('/api/homepage/reorder', { method: 'POST', body: JSON.stringify({ orderedIds: ordered.map((s) => s.id) }) });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Reorder failed', 'error');
      reload();
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api(`/api/homepage/sections/${toDelete.id}`, { method: 'DELETE' });
      toast('Section removed');
      setToDelete(null);
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not remove', 'error');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Content" title="Homepage">
        <div className="flex rounded-md border border-line p-0.5 text-sm">
          {(['en', 'ar'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`rounded px-3 py-1.5 uppercase ${lang === l ? 'bg-white/[0.08] text-white' : 'text-muted'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <select className="input max-w-[160px]" value={addType} onChange={(e) => setAddType(e.target.value)}>
          {SECTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-red" onClick={addSection} disabled={adding}>
          Add section
        </button>
      </PageHeader>

      {sections === null ? (
        <Spinner />
      ) : sections.length === 0 ? (
        <EmptyState title="No sections yet" hint="Build the homepage by adding sections in the order they should appear." />
      ) : (
        <ul className="flex flex-col gap-2">
          {sections.map((s, i) => (
            <li key={s.id} className="panel flex items-center gap-4 rounded-xl px-4 py-3">
              <div className="flex flex-col">
                <button type="button" className="text-muted hover:text-white disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="text-muted hover:text-white disabled:opacity-30"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                >
                  ↓
                </button>
              </div>
              <span className="chip">{s.type}</span>
              <span className="text-sm text-muted">{(s.config.headline as string) || (s.config.title as string) || ''}</span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(s)}
                  className={`chip ${s.enabled ? 'text-emerald-400' : 'text-muted'}`}
                >
                  {s.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(s)}>
                  Configure
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setToDelete(s)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <SectionConfig
          section={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {toDelete && (
        <ConfirmDialog
          title="Remove section?"
          body={`The ${toDelete.type} section will be removed from the homepage.`}
          confirmLabel="Remove"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}

type Cfg = Record<string, unknown>;

// Defined at module scope (not inside SectionConfig) so their component identity is stable
// across renders — otherwise every keystroke remounts the input and it loses focus, which
// looks like text being entered "one character at a time".
function CfgText({ cfg, setK, k, label, area }: { cfg: Cfg; setK: (k: string, v: unknown) => void; k: string; label: string; area?: boolean }) {
  const val = (cfg[k] as string) ?? '';
  return (
    <div className="field">
      <label htmlFor={`cfg-${k}`}>{label}</label>
      {area ? (
        <textarea id={`cfg-${k}`} className="input" rows={2} value={val} onChange={(e) => setK(k, e.target.value)} />
      ) : (
        <input id={`cfg-${k}`} className="input" value={val} onChange={(e) => setK(k, e.target.value)} />
      )}
    </div>
  );
}

function CfgNum({ cfg, setK, k, label }: { cfg: Cfg; setK: (k: string, v: unknown) => void; k: string; label: string }) {
  return (
    <div className="field">
      <label htmlFor={`cfg-${k}`}>{label}</label>
      <input
        id={`cfg-${k}`}
        type="number"
        className="input"
        value={(cfg[k] as number) ?? ''}
        onChange={(e) => setK(k, e.target.value === '' ? undefined : Number(e.target.value))}
      />
    </div>
  );
}

function SectionConfig({ section, onClose, onSaved }: { section: Section; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [cfg, setCfg] = useState<Cfg>(section.config ?? {});
  const [busy, setBusy] = useState(false);

  const setK = (k: string, v: unknown) => setCfg((c) => ({ ...c, [k]: v }));

  async function save() {
    setBusy(true);
    // Drop empty strings so optional fields stay unset (and pass htmlSafe/url validation).
    const clean: Cfg = {};
    for (const [k, v] of Object.entries(cfg)) {
      if (v === '' || v === undefined || v === null) continue;
      clean[k] = v;
    }
    try {
      await api(`/api/homepage/sections/${section.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ config: clean, version: section.version }),
      });
      toast('Section saved');
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
      setBusy(false);
    }
  }

  return (
    <Modal title={`Configure ${section.type}`} onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        {section.type === 'HERO' && (
          <>
            <CfgText cfg={cfg} setK={setK} k="headline" label="Headline" />
            <CfgText cfg={cfg} setK={setK} k="subheadline" label="Subheadline" area />
            <CfgText cfg={cfg} setK={setK} k="ctaText" label="CTA text" />
            <CfgText cfg={cfg} setK={setK} k="ctaLink" label="CTA link" />
            <MediaField label="Background" value={(cfg.backgroundMediaId as string) ?? null} onChange={(id) => setK('backgroundMediaId', id ?? undefined)} allow="image" />
          </>
        )}
        {section.type === 'CTA' && (
          <>
            <CfgText cfg={cfg} setK={setK} k="headline" label="Headline" />
            <CfgText cfg={cfg} setK={setK} k="subheadline" label="Subheadline" area />
            <CfgText cfg={cfg} setK={setK} k="buttonText" label="Button text" />
            <CfgText cfg={cfg} setK={setK} k="buttonLink" label="Button link" />
          </>
        )}
        {(section.type === 'SERVICES' || section.type === 'PROJECTS' || section.type === 'CLIENTS' || section.type === 'TESTIMONIALS') && (
          <>
            <CfgText cfg={cfg} setK={setK} k="title" label="Title" />
            {section.type === 'SERVICES' && <CfgText cfg={cfg} setK={setK} k="description" label="Description" area />}
            <CfgNum cfg={cfg} setK={setK} k="maxItems" label="Max items" />
            {section.type === 'PROJECTS' && (
              <label className="flex items-center gap-2.5 text-sm">
                <input type="checkbox" checked={!!cfg.featured} onChange={(e) => setK('featured', e.target.checked)} className="accent-red" />
                Featured projects only
              </label>
            )}
          </>
        )}
        {section.type === 'STATS' && <ItemsEditor label="Stats" fields={['label', 'value']} value={(cfg.items as Cfg[]) ?? []} onChange={(v) => setK('items', v)} extra={<CfgText cfg={cfg} setK={setK} k="title" label="Title" />} />}
        {section.type === 'FAQ' && <ItemsEditor label="Questions" fields={['question', 'answer']} value={(cfg.items as Cfg[]) ?? []} onChange={(v) => setK('items', v)} extra={<CfgText cfg={cfg} setK={setK} k="title" label="Title" />} />}
        {(section.type === 'BEFORE_AFTER' || section.type === 'PROCESS') && (
          <>
            <CfgText cfg={cfg} setK={setK} k="title" label="Heading" />
            <p className="text-[13px] text-muted">This section&apos;s inner content is themed in the site design; the heading is editable here.</p>
          </>
        )}

        <div className="mt-2 flex justify-end gap-2.5">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-red btn-sm" onClick={save} disabled={busy}>
            {busy ? 'Saving…' : 'Save section'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ItemsEditor({
  label,
  fields,
  value,
  onChange,
  extra,
}: {
  label: string;
  fields: string[];
  value: Cfg[];
  onChange: (v: Cfg[]) => void;
  extra?: React.ReactNode;
}) {
  return (
    <>
      {extra}
      <div className="field">
        <label>{label}</label>
        <div className="flex flex-col gap-2">
          {value.map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-md border border-line p-2">
              <div className="flex flex-1 flex-col gap-2">
                {fields.map((f) => (
                  <input
                    key={f}
                    className="input"
                    placeholder={f}
                    value={(item[f] as string) ?? ''}
                    onChange={(e) => {
                      const next = [...value];
                      next[i] = { ...item, [f]: e.target.value };
                      onChange(next);
                    }}
                  />
                ))}
              </div>
              <button type="button" className="text-muted hover:text-red" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                ✕
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm self-start" onClick={() => onChange([...value, {}])}>
            Add row
          </button>
        </div>
      </div>
    </>
  );
}
