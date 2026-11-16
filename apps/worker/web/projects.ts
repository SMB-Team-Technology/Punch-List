import { operations } from '@ext/lib/ops';
import { pageErrors } from '@ext/lib/page-errors';
import { peers } from '@ext/lib/presence';
import { uploadFile } from '@ext/lib/share';
import { toast as showToast } from '@ext/lib/toasts';
import type { DrawOp } from '@ext/lib/types';
import { uploadPath } from '@marklayer/brand/links';
import { postBody, postJson } from '@marklayer/types/http';
import { transcribeResponseSchema } from '@marklayer/types/uploads';
import { batch, signal } from '@preact/signals';
import { nanoid } from 'nanoid';
import { unwrapSafeLink } from '../shared/safe-link';
import { capture } from './analytics';
import { cleanPageUrl, pageKey } from './pageUrl';
import { iframeScrollY } from './viewer-state';

export type UploadKind = 'pdf' | 'image';

export interface ProjectPage {
  id: string;
  url: string | null;
  width: number | null;
  /** Cached ops fetched on initial project load — used for combined export. Stale once user switches pages. */
  ops: DrawOp[];
}

export const API_BASE = '/api/';

/** Project (multi-page) state. `projectId` is null when viewing a single-page share. */
export const projectId = signal<string | null>(null);
export const projectPages = signal<ProjectPage[]>([]);
export const currentPageIdx = signal(0);
/** True while the project is loading or a page is being added. */
export const projectLoading = signal(false);

/** Single-page share state — set when on `/s/:id`. */
export const annotationId = signal('');
export const pageUrl = signal('');
export const originalWidth = signal(0);

/** Fetch a project's page list + ops. Returns null on failure. */
async function loadProject(
  id: string,
): Promise<{ pages: ProjectPage[]; createdAt: number | null; expiresAt: number | null } | null> {
  try {
    const res = await fetch(`${API_BASE}p/${id}`);
    if (!res.ok) return null;
    const json = await res.json<{
      pages: { id: string; ops: DrawOp[]; url: string | null; width: number | null }[];
      createdAt: number | null;
      expiresAt: number | null;
    }>();
    return {
      pages: json.pages.map((p) => ({ id: p.id, url: p.url, width: p.width, ops: p.ops })),
      createdAt: json.createdAt,
      expiresAt: json.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Re-read every page's ops, keeping the open page's live ones. Other pages were
 * loaded once with the site, and another reviewer may have marked them since;
 * the all-pages list is only worth reading if it is current.
 */
export async function refreshSitePages(): Promise<void> {
  const pid = projectId.value;
  if (!pid) return;
  const data = await loadProject(pid);
  if (!data || projectId.value !== pid) return;
  const fresh = new Map(data.pages.map((p) => [p.id, p.ops]));
  const idx = currentPageIdx.value;
  projectPages.value = projectPages.value.map((p, i) => (i === idx ? p : { ...p, ops: fresh.get(p.id) ?? p.ops }));
}

/** Persist a project's page-id list. */
export async function saveProject(id: string, pageIds: string[]): Promise<boolean> {
  const res = await postJson(`${API_BASE}p/${id}`, { pageIds });
  return res?.ok ?? false;
}

/** Recorded camera and screen clips; `kind=video` keeps the server from storing them as audio. */
export const uploadVideo = (file: File | Blob): Promise<string | null> => uploadFile(file, { kind: 'video' });

/** A video note's transcript, cut from the audio track recorded beside it, which goes up in the call itself. */
export async function transcribeVideo({ id, audio }: { id: string; audio: Blob }): Promise<string | null> {
  const res = await postBody(`${uploadPath(id)}/transcribe`, audio, audio.type || 'application/octet-stream');
  if (!res?.ok) return null;
  const parsed = transcribeResponseSchema.safeParse(await res.json());
  return parsed.success ? parsed.data.text : null;
}

/** Writes a room's row. The one place that names what a row is made of. */
export async function saveRoom({
  id,
  ops,
  url,
  width,
}: {
  id: string;
  ops: DrawOp[];
  url: string;
  width: number;
}): Promise<boolean> {
  const res = await postJson(`${API_BASE}${id}`, { ops, url, width });
  return res?.ok ?? false;
}

/** What a refused page add says: outside the team, a new page must stay on the board's own site. */
export const OTHER_SITE_TOAST = 'That page is on another site. Only the SMB Team can start a list there.';

/**
 * The width every new page is laid out at in desktop view. It used to be the
 * creator's window, so a page first opened in a narrow window kept the site's
 * mobile layout for everyone; a fixed desktop size gives every reviewer the same
 * layout, Auto zoom fits it to their screen, and marks line up between them.
 */
export const DESKTOP_REFERENCE_WIDTH = 1440;

/** The room the viewer is on now, which a new page is opened from. */
function currentRoomId(): string | undefined {
  if (projectId.value) return projectPages.value[currentPageIdx.value]?.id;
  return annotationId.value || undefined;
}

/**
 * Create an empty annotation row for a URL. `from` lets someone outside the team
 * add a page on the same site as the room they are in; a 403 means it was not.
 */
export async function createAnnotationFor(url: string): Promise<{ id: string } | { error: string }> {
  const id = nanoid();
  const res = await postJson(`${API_BASE}${id}`, {
    ops: [],
    url,
    width: DESKTOP_REFERENCE_WIDTH,
    from: currentRoomId(),
  });
  if (res?.ok) return { id };
  return { error: res?.status === 403 ? OTHER_SITE_TOAST : 'Failed to add page' };
}

/** A typed address as a fetchable URL: `example.com` means https, and an Outlook Safe Link means its target. */
export const withScheme = (url: string): string => unwrapSafeLink(/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** The page list with the open page's cached ops brought up to date, before leaving it or rewriting the list. */
const pagesWithLiveOps = () =>
  projectPages.value.map((p, j) => (j === currentPageIdx.value ? { ...p, ops: [...operations.value] } : p));

/**
 * The one transition onto a project page: everything that belongs to the page on
 * screen moves here together. Cached ops are copied so later mutations on either
 * page can't bleed across. Render state follows `pageUrl` in `useRenderOutcome`.
 */
function activatePage(i: number) {
  const page = projectPages.value[i];
  if (!page) return;
  batch(() => {
    currentPageIdx.value = i;
    if (annotationId.value === page.id) return;
    annotationId.value = page.id;
    pageUrl.value = page.url ?? '';
    originalWidth.value = page.width ?? 0;
    operations.value = [...page.ops];
    iframeScrollY.value = 0;
    peers.value = new Map();
    // Only a proxied HTML page ever reports again, so an upload would keep the last page's errors.
    pageErrors.value = [];
  });
  const url = new URL(location.href);
  if (i === 0) url.searchParams.delete('page');
  else url.searchParams.set('page', String(i));
  history.replaceState(null, '', url);
}

/** Show another page of the open project, keeping the live ops of the one being left. */
export function switchPage(i: number) {
  if (i === currentPageIdx.value) return;
  projectPages.value = pagesWithLiveOps();
  activatePage(i);
}

/** Load `/p/:id` and show the page its URL selected. */
export async function openProject(pid: string) {
  projectLoading.value = true;
  const data = await loadProject(pid);
  projectLoading.value = false;
  if (!data) {
    showToast('Project not found or expired', { type: 'error', duration: 4000 });
    return;
  }
  projectPages.value = data.pages;
  activatePage(Math.max(0, Math.min(currentPageIdx.value, data.pages.length - 1)));
}

/** Drop a page from the open project, staying on the same page or shifting left when it was the active one. */
export async function removeProjectPage(i: number): Promise<boolean> {
  const pid = projectId.value;
  if (!pid) return false;
  const idx = currentPageIdx.value;
  projectLoading.value = true;
  const next = pagesWithLiveOps().filter((_, j) => j !== i);
  projectPages.value = next;
  activatePage(i < idx ? idx - 1 : i === idx ? Math.min(idx, next.length - 1) : idx);
  const ok = await saveProject(
    pid,
    next.map((p) => p.id),
  );
  projectLoading.value = false;
  return ok;
}

/** Append `url` to the open project and show it, or show the page that already has it. Null on failure. */
export async function addProjectPage(raw: string): Promise<'added' | 'existing' | null> {
  const pid = projectId.value;
  // One page per click: a link can report twice, and a second create while the
  // first is in flight left an orphaned copy of the page behind.
  if (!pid || projectLoading.value) return null;
  const url = cleanPageUrl(raw);
  // The same page twice would split its annotations across two rooms; `/about` and `/about/` are one page.
  const key = pageKey(url);
  const existing = projectPages.value.findIndex((p) => p.url !== null && pageKey(p.url) === key);
  if (existing !== -1) {
    switchPage(existing);
    return 'existing';
  }
  projectLoading.value = true;
  const created = await createAnnotationFor(url);
  if ('error' in created) {
    projectLoading.value = false;
    capture('page_open_failed', { mode: 'project_page', step: 'create_page' });
    showToast(created.error, { type: 'error' });
    return null;
  }
  const next: ProjectPage[] = [...pagesWithLiveOps(), { id: created.id, url, width: DESKTOP_REFERENCE_WIDTH, ops: [] }];
  projectPages.value = next;
  const ok = await saveProject(
    pid,
    next.map((p) => p.id),
  );
  projectLoading.value = false;
  if (!ok) {
    capture('page_open_failed', { mode: 'project_page', step: 'save_project' });
    showToast('Failed to save project', { type: 'error' });
    return null;
  }
  switchPage(next.length - 1);
  return 'added';
}

/**
 * Navigate to a new URL.
 * - In project mode (`/p/:id`): append a new page to the project and switch to it (no full reload).
 * - In single-share mode (`/s/:id`): convert to a project bundling the current + new page, redirect to `/p/:projectId`.
 * - On landing (no context): create a fresh `/s/:id` share for the new URL.
 */
export async function navigateTo({
  url: raw,
  source = 'viewer',
  kind,
}: {
  url: string;
  source?: string;
  kind?: UploadKind;
}) {
  if (projectLoading.value) return;
  const url = cleanPageUrl(raw);
  const pid = projectId.value;
  const currentUrl = pageUrl.value;
  // A link back to the page already open (a logo, a "home" link) is no new page.
  if (!pid && currentUrl && pageKey(currentUrl) === pageKey(url)) return;
  // Which of the three shapes a session takes — a first page, a second page that
  // promotes a share into a project, another page on an existing project — and
  // what asked for it. Counted here because this is where every entry point lands.
  capture('page_opened', { mode: pid ? 'project_page' : annotationId.value ? 'promoted' : 'new', source, kind });
  if (pid) {
    await addProjectPage(url);
    return;
  }

  // Single-share mode: promote into a project bundling current + new
  const currentId = annotationId.value;
  if (currentId && currentUrl) {
    projectLoading.value = true;
    // Best-effort flush of current ops so the project's first page has them on first read
    await saveRoom({
      id: currentId,
      ops: operations.value,
      url: currentUrl,
      width: originalWidth.value || DESKTOP_REFERENCE_WIDTH,
    });
    const created = await createAnnotationFor(url);
    if ('error' in created) {
      projectLoading.value = false;
      capture('page_open_failed', { mode: 'promoted', step: 'create_page' });
      showToast(created.error, { type: 'error' });
      return;
    }
    const newPageId = created.id;
    const newProjectId = nanoid();
    const ok = await saveProject(newProjectId, [currentId, newPageId]);
    if (!ok) {
      projectLoading.value = false;
      capture('page_open_failed', { mode: 'promoted', step: 'save_project' });
      showToast('Failed to create project', { type: 'error' });
      return;
    }
    location.href = `/p/${newProjectId}?page=1`;
    return;
  }

  // Landing: a new list is a site from its first page, so the link it opens on
  // is the one link it keeps — every page added later lands inside it.
  const id = nanoid();
  const res = await postJson(`${API_BASE}${id}`, { ops: [], url, width: DESKTOP_REFERENCE_WIDTH });
  // Refused outright: there is no board to land on, so stay and say why.
  if (res?.status === 403) {
    showToast('Only the SMB Team can start a new list. Sign in with your smbteam.com email first.', {
      type: 'error',
    });
    return;
  }
  if (!res?.ok) {
    // Instrumented like the other two modes, so a drop at the top of the funnel
    // is a number rather than a mystery. The redirect still runs: the viewer
    // re-creates the row on save, and stranding someone on the landing page is worse.
    capture('page_open_failed', { mode: 'new', step: 'create_page' });
  }
  const siteId = nanoid();
  if (!(await saveProject(siteId, [id]))) {
    capture('page_open_failed', { mode: 'new', step: 'save_project' });
    location.href = `/s/${id}`;
    return;
  }
  location.href = `/p/${siteId}`;
}
