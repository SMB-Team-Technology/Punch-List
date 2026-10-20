import {
  createFolderResponseSchema,
  errorResponseSchema,
  type Folder,
  foldersResponseSchema,
  type OwnedLink,
  ownedLinksResponseSchema,
  postJson,
  resolveOwnerExpiresAt,
  type SessionUser,
  sessionResponseSchema,
  type UpdateLinkSettings,
  updateLinkResponseSchema,
} from '@marklayer/types';
import { signal } from '@preact/signals';

/**
 * Dashboard state, deliberately its own module.
 *
 * `web/signals.ts` runs `parseViewParam()` against `location.pathname` at module
 * load and installs effects that write to `history` — all of it viewer logic
 * that would fire on `/app` and mean nothing here. The dashboard shares the
 * stylesheet and nothing else.
 */
export const user = signal<SessionUser | null>(null);
export const sessionLoading = signal(true);
export const links = signal<OwnedLink[]>([]);
export const linksLoading = signal(false);
export const folders = signal<Folder[]>([]);

/** Which lists the dashboard shows. It lives in the URL (see dashboard-main), so Back walks out of a folder. */
export type FolderFilter = { kind: 'all' } | { kind: 'unfiled' } | { kind: 'folders' } | { kind: 'folder'; id: string };

export type ListLayout = 'list' | 'grid';
const LAYOUT_KEY = 'marklayer:dash-layout';

function storedLayout(): ListLayout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

/** A per-browser preference, so it is remembered here and nowhere else. */
export const listLayout = signal<ListLayout>(storedLayout());

export function setListLayout(layout: ListLayout): void {
  listLayout.value = layout;
  try {
    localStorage.setItem(LAYOUT_KEY, layout);
  } catch {
    // Blocked storage only costs the choice on the next visit.
  }
}

/** The search box. Kept across tabs, so a client found under All is still found inside their folder. */
export const searchQuery = signal('');

async function readJson(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

/**
 * Resolves the cookie on boot. A 401 is the signed-out answer, not a failure.
 *
 * Both requests go out together: `/auth/links` answers 401 harmlessly when
 * signed out, and awaiting it after the session would put a second round trip in
 * front of the page a magic link redirects into.
 */
export async function loadSession(): Promise<void> {
  sessionLoading.value = true;
  linksLoading.value = true;
  const [me, owned, filed] = await Promise.all([fetch('/auth/me'), fetch('/auth/links'), fetch('/auth/folders')]);
  const session = sessionResponseSchema.safeParse(await readJson(me));
  user.value = session.success ? session.data.user : null;
  sessionLoading.value = false;
  const list = ownedLinksResponseSchema.safeParse(await readJson(owned));
  links.value = user.value && list.success ? list.data.links : [];
  const folderList = foldersResponseSchema.safeParse(await readJson(filed));
  folders.value = user.value && folderList.success ? folderList.data.folders : [];
  linksLoading.value = false;
}

async function loadFolders(): Promise<void> {
  const parsed = foldersResponseSchema.safeParse(await readJson(await fetch('/auth/folders')));
  if (parsed.success) folders.value = parsed.data.folders;
}

export async function loadLinks(): Promise<void> {
  linksLoading.value = true;
  const parsed = ownedLinksResponseSchema.safeParse(await readJson(await fetch('/auth/links')));
  links.value = parsed.success ? parsed.data.links : [];
  linksLoading.value = false;
}

/** The message to show for a POST that failed or never left, or null when it succeeded. */
async function errorFrom(res: Response | null): Promise<string | null> {
  if (res?.ok) return null;
  const parsed = errorResponseSchema.safeParse(res ? await readJson(res) : null);
  return parsed.success ? parsed.data.error : 'Something went wrong. Try again.';
}

/** Returns an error message, or null when the link is on its way. */
export async function requestSignIn(email: string): Promise<string | null> {
  return errorFrom(await postJson('/auth/request', { email }));
}

/** Returns an error message, or null when the invite is on its way. */
export async function inviteToLink({
  id,
  email,
  url,
}: {
  id: string;
  email: string;
  url: string;
}): Promise<string | null> {
  return errorFrom(await postJson(`/auth/links/${encodeURIComponent(id)}/invite`, { email, url }));
}

export async function signOut(): Promise<void> {
  await fetch('/auth/logout', { method: 'POST' });
  user.value = null;
  links.value = [];
  folders.value = [];
}

/** Returns an error message, or null when the folder exists. */
export async function createFolder(name: string): Promise<string | null> {
  const res = await postJson('/auth/folders', { name });
  const created = createFolderResponseSchema.safeParse(res?.ok ? await readJson(res) : null);
  if (!created.success) return errorFrom(res);
  folders.value = [...folders.value, created.data.folder].sort((a, b) => a.name.localeCompare(b.name));
  return null;
}

/** Returns an error message, or null when the folder was renamed. */
export async function renameFolder({ id, name }: { id: string; name: string }): Promise<string | null> {
  const res = await fetch(`/auth/folders/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const error = await errorFrom(res);
  await loadFolders();
  return error;
}

/** Its links are unfiled by the server, not deleted, so they are reloaded rather than patched. */
export async function deleteFolder(id: string): Promise<void> {
  await fetch(`/auth/folders/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await Promise.all([loadFolders(), loadLinks()]);
}

export async function moveLink({ id, folderId }: { id: string; folderId: string | null }): Promise<void> {
  // Optimistic like releaseLink; a refused move resyncs from the server.
  links.value = links.value.map((link) => (link.id === id ? { ...link, folderId } : link));
  const res = await fetch(`/auth/links/${encodeURIComponent(id)}/folder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  });
  if (!res.ok) await loadLinks();
}

export async function claimLink(id: string): Promise<void> {
  await fetch(`/auth/links/${encodeURIComponent(id)}`, { method: 'POST' });
  await loadLinks();
}

export async function releaseLink(id: string): Promise<void> {
  // Optimistic: the row is gone from this list either way, and a failed release
  // resurfaces on the next load rather than blocking the click.
  links.value = links.value.filter((link) => link.id !== id);
  await fetch(`/auth/links/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function updateLinkSettings({ id, patch }: { id: string; patch: UpdateLinkSettings }): Promise<boolean> {
  // Optimistic, like releaseLink: the settings panel reflects the choice right
  // away, and a failed PATCH resyncs from the server rather than blocking the click.
  links.value = links.value.map((link) =>
    link.id === id
      ? {
          ...link,
          access: patch.access ?? link.access,
          ownerExpiresAt: resolveOwnerExpiresAt({
            ownerExpiresIn: patch.ownerExpiresIn,
            current: link.ownerExpiresAt,
            now: Math.floor(Date.now() / 1000),
          }),
        }
      : link,
  );
  const res = await fetch(`/auth/links/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const parsed = updateLinkResponseSchema.safeParse(await readJson(res));
  const updated = parsed.success && parsed.data.updated;
  if (!updated) await loadLinks();
  return updated;
}

/**
 * Sets, changes or (with `null`) removes a link's password. Not optimistic: the
 * change ends every open session on the link, so the panel waits to be sure.
 * Returns an error message, or null when it took.
 */
export async function setLinkPassword({
  id,
  password,
}: {
  id: string;
  password: string | null;
}): Promise<string | null> {
  const res = await fetch(`/auth/links/${encodeURIComponent(id)}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  }).catch(() => null);
  const failed = await errorFrom(res);
  if (failed) return failed;
  const parsed = updateLinkResponseSchema.safeParse(res ? await readJson(res) : null);
  if (!parsed.success || !parsed.data.updated) return 'Only the owner can change this link.';
  links.value = links.value.map((link) => (link.id === id ? { ...link, passwordProtected: password !== null } : link));
  return null;
}
