'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../components/auth-provider';
import { useToast } from '../../../../components/toast';
import { PageHeader, Spinner, StatusPill, ConfirmDialog } from '../../../../components/ui';
import { SeoFields, type Seo } from '../../../../components/form';
import { MediaPicker, MediaThumb, useMediaList, type MediaItem } from '../../../../components/media-lib';

interface MediaRef { mediaId: string; type: 'GALLERY' | 'VIDEO' | 'BEFORE_AFTER'; order: number }
interface Named { id: string; name: string }
interface RelatedProject { id: string; title: string; slug: string }

interface Project {
  id: string;
  title: string;
  slug: string;
  status: string;
  version: number;
  featured: boolean;
  overview: string | null;
  description: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  clientId: string | null;
  locale: string;
  seo: Seo;
  media: MediaRef[];
  services: Named[];
  relatedProjects: RelatedProject[];
}

const TABS = ['Details', 'Case study', 'Media', 'Relations', 'SEO'] as const;
type Tab = (typeof TABS)[number];

const STATUS_ACTIONS: Record<string, { label: string; action: string; kind: 'red' | 'ghost' }[]> = {
  DRAFT: [{ label: 'Publish', action: 'publish', kind: 'red' }],
  PUBLISHED: [
    { label: 'Unpublish', action: 'unpublish', kind: 'ghost' },
    { label: 'Archive', action: 'archive', kind: 'ghost' },
  ],
  ARCHIVED: [{ label: 'Restore', action: 'restore', kind: 'ghost' }],
};

export default function ProjectEditorPage() {
  const { api } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>('Details');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Editable state
  const [form, setForm] = useState<Partial<Project>>({});
  const [mediaRefs, setMediaRefs] = useState<MediaRef[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [relatedIds, setRelatedIds] = useState<string[]>([]);
  const [seo, setSeo] = useState<Seo>({});

  const [clients, setClients] = useState<Named[]>([]);
  const [allServices, setAllServices] = useState<Named[]>([]);
  const [allProjects, setAllProjects] = useState<RelatedProject[]>([]);
  const { items: mediaLib } = useMediaList();
  // Items picked this session (e.g. a link just added) may not be in the mount-time
  // library fetch, so track them here and merge — otherwise their thumbnail renders blank.
  const [pickedMedia, setPickedMedia] = useState<MediaItem[]>([]);

  const mediaById = useMemo(() => {
    const map = new Map<string, MediaItem>();
    (mediaLib ?? []).forEach((m) => map.set(m.id, m));
    pickedMedia.forEach((m) => map.set(m.id, m));
    return map;
  }, [mediaLib, pickedMedia]);

  const load = useCallback(() => {
    api<Project>(`/api/projects/${id}`)
      .then((p) => {
        setProject(p);
        setForm({
          title: p.title,
          slug: p.slug,
          locale: p.locale,
          featured: p.featured,
          overview: p.overview,
          description: p.description,
          challenge: p.challenge,
          solution: p.solution,
          results: p.results,
          clientId: p.clientId,
        });
        setMediaRefs(p.media);
        setServiceIds(p.services.map((s) => s.id));
        setRelatedIds(p.relatedProjects.map((r) => r.id));
        setSeo(p.seo ?? {});
      })
      .catch(() => setNotFound(true));
  }, [api, id]);

  useEffect(() => {
    load();
    api<{ items: Named[] }>('/api/clients?limit=100').then((r) => setClients(r.items)).catch(() => undefined);
    api<{ items: Named[] }>('/api/services?limit=100').then((r) => setAllServices(r.items)).catch(() => undefined);
    api<{ items: RelatedProject[] }>('/api/projects?limit=100').then((r) => setAllProjects(r.items)).catch(() => undefined);
  }, [load, api]);

  function set<K extends keyof Project>(key: K, value: Project[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!project) return;
    setBusy(true);
    const seoClean = { title: seo.title || undefined, metaDescription: seo.metaDescription || undefined };
    const payload = {
      title: (form.title ?? '').trim(),
      overview: form.overview ?? undefined,
      description: form.description ?? undefined,
      challenge: form.challenge ?? undefined,
      solution: form.solution ?? undefined,
      results: form.results ?? undefined,
      clientId: form.clientId ?? null,
      slug: form.slug?.trim() || undefined,
      locale: form.locale === 'ar' ? 'ar' : 'en',
      featured: !!form.featured,
      mediaRefs: mediaRefs.map((m, i) => ({ mediaId: m.mediaId, type: m.type, order: i })),
      serviceIds,
      relatedIds,
      seo: seoClean,
      version: project.version,
    };
    try {
      const updated = await api<Project>(`/api/projects/${project.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      toast('Project saved');
      setProject((p) => (p ? { ...p, version: updated.version, slug: updated.slug } : p));
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function runStatus(action: string) {
    if (!project) return;
    try {
      await api(`/api/projects/${project.id}/status`, { method: 'POST', body: JSON.stringify({ action, version: project.version }) });
      toast('Status updated');
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  }

  async function doDelete() {
    if (!project) return;
    setBusy(true);
    try {
      await api(`/api/projects/${project.id}`, { method: 'DELETE' });
      toast('Project deleted');
      router.replace('/projects');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete', 'error');
      setBusy(false);
    }
  }

  if (notFound) {
    return (
      <div>
        <PageHeader title="Project not found" eyebrow={<Link href="/projects">← Projects</Link>} />
        <p className="text-sm text-muted">This project may have been deleted.</p>
      </div>
    );
  }
  if (!project) return <Spinner />;

  return (
    <div>
      <PageHeader
        eyebrow={
          <Link href="/projects" className="hover:text-white">
            ← Projects
          </Link>
        }
        title={form.title || project.title}
      >
        <StatusPill status={project.status} />
        {(STATUS_ACTIONS[project.status] ?? []).map((a) => (
          <button key={a.action} type="button" className={`btn btn-sm ${a.kind === 'red' ? 'btn-red' : 'btn-ghost'}`} onClick={() => runStatus(a.action)}>
            {a.label}
          </button>
        ))}
        <button type="button" className="btn btn-red btn-sm" onClick={save} disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </PageHeader>

      <div className="mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'border-red text-white' : 'border-transparent text-muted hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Details' && (
        <div className="panel max-w-2xl rounded-xl p-6">
          <div className="flex flex-col gap-4">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" className="input" value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="overview">Overview</label>
              <textarea id="overview" className="input" rows={2} value={form.overview ?? ''} onChange={(e) => set('overview', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="client">Client</label>
              <select id="client" className="input" value={form.clientId ?? ''} onChange={(e) => set('clientId', e.target.value || null)}>
                <option value="">— None —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="field">
                <label htmlFor="slug">Slug (URL)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted">/work/</span>
                  <input id="slug" className="input" value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="my-project" />
                </div>
                <p className="text-[12px] text-muted">Must be unique across all projects.</p>
              </div>
              <div className="field">
                <label htmlFor="locale">Language</label>
                <select id="locale" className="input" value={form.locale ?? 'en'} onChange={(e) => set('locale', e.target.value)}>
                  <option value="en">English</option>
                  <option value="ar">العربية (Arabic)</option>
                </select>
                <p className="text-[12px] text-muted">Which site shows this project.</p>
              </div>
            </div>
            <label className="flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={!!form.featured} onChange={(e) => set('featured', e.target.checked)} className="accent-red" />
              Featured — show in the homepage “Selected work”
            </label>
          </div>
        </div>
      )}

      {tab === 'Case study' && (
        <div className="panel max-w-2xl rounded-xl p-6">
          <div className="flex flex-col gap-4">
            {(['description', 'challenge', 'solution', 'results'] as const).map((k) => (
              <div className="field" key={k}>
                <label htmlFor={k} className="capitalize">
                  {k}
                </label>
                <textarea id={k} className="input" rows={4} value={form[k] ?? ''} onChange={(e) => set(k, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Media' && (
        <MediaTab
          refs={mediaRefs}
          setRefs={setMediaRefs}
          mediaById={mediaById}
          onPickMedia={(m) => setPickedMedia((prev) => [...prev, m])}
        />
      )}

      {tab === 'Relations' && (
        <div className="grid max-w-3xl gap-5 md:grid-cols-2">
          <PickList
            title="Services"
            hint="Which services this project showcases."
            options={allServices.map((s) => ({ id: s.id, label: s.name }))}
            selected={serviceIds}
            onToggle={(sid) => setServiceIds((v) => (v.includes(sid) ? v.filter((x) => x !== sid) : [...v, sid]))}
          />
          <PickList
            title="Related projects"
            hint="Shown at the bottom of the case study."
            options={allProjects.filter((p) => p.id !== project.id).map((p) => ({ id: p.id, label: p.title }))}
            selected={relatedIds}
            onToggle={(pid) => setRelatedIds((v) => (v.includes(pid) ? v.filter((x) => x !== pid) : [...v, pid]))}
          />
        </div>
      )}

      {tab === 'SEO' && (
        <div className="panel max-w-2xl rounded-xl p-6">
          <SeoFields seo={seo} onChange={setSeo} />
        </div>
      )}

      <div className="mt-8 border-t border-line pt-5">
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
          Delete project
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete project?"
          body={`“${project.title}” and its case-study content will be permanently removed.`}
          busy={busy}
          onConfirm={doDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

function MediaTab({
  refs,
  setRefs,
  mediaById,
  onPickMedia,
}: {
  refs: MediaRef[];
  setRefs: (r: MediaRef[]) => void;
  mediaById: Map<string, MediaItem>;
  onPickMedia: (m: MediaItem) => void;
}) {
  const [picking, setPicking] = useState(false);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= refs.length) return;
    const next = [...refs];
    const a = next[i];
    const b = next[j];
    if (!a || !b) return;
    next[i] = b;
    next[j] = a;
    setRefs(next);
  }

  return (
    <div className="panel max-w-2xl rounded-xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">Gallery images, videos, and before/after pairs.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPicking(true)}>
          Add media
        </button>
      </div>

      {refs.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No media attached yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {refs.map((r, i) => {
            const item = mediaById.get(r.mediaId);
            return (
              <li key={`${r.mediaId}-${i}`} className="flex items-center gap-3 rounded-lg border border-line p-2">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-black/30 text-xs text-muted">
                  {item ? <MediaThumb item={item} className="h-full w-full" /> : '—'}
                </div>
                <select
                  className="input max-w-[160px]"
                  value={r.type}
                  onChange={(e) => {
                    const next = [...refs];
                    next[i] = { ...r, type: e.target.value as MediaRef['type'] };
                    setRefs(next);
                  }}
                >
                  <option value="GALLERY">Gallery</option>
                  <option value="VIDEO">Video</option>
                  <option value="BEFORE_AFTER">Before / after</option>
                </select>
                <div className="ml-auto flex gap-1">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} aria-label="Move down">
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => setRefs(refs.filter((_, idx) => idx !== i))}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(m) => {
            onPickMedia(m);
            setRefs([...refs, { mediaId: m.id, type: m.type === 'VIDEO' ? 'VIDEO' : 'GALLERY', order: refs.length }]);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

function PickList({
  title,
  hint,
  options,
  selected,
  onToggle,
}: {
  title: string;
  hint: string;
  options: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="panel rounded-xl p-5">
      <h3 className="text-base">{title}</h3>
      <p className="mb-3 mt-0.5 text-[13px] text-muted">{hint}</p>
      {options.length === 0 ? (
        <p className="text-sm text-muted">Nothing to choose from yet.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {options.map((o) => (
            <li key={o.id}>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-white/[0.03]">
                <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} className="accent-red" />
                <span className={selected.includes(o.id) ? 'text-white' : 'text-muted'}>{o.label}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
