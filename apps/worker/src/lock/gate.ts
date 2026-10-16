import { ROOM_LOCKED_CLOSE_CODE, ROOM_PASSWORD_HEADER, type SessionUser } from '@marklayer/types';
import { parse as parseCookieHeader } from 'hono/utils/cookie';
import { userFromCookieHeader } from '../auth/session';
import { sha256Hex } from '../http';
import { annotationStore, nowInSeconds, type RoomLock, unlockFailureStore } from '../store';
import { signUnlock, UNLOCK_TTL_SECONDS, unlockCookieName, verifyPassword, verifyUnlock } from './password';

/** Wrong guesses one client gets per room per window before every guess is refused unchecked. */
export const MAX_FAILURES = 10;
export const FAILURE_WINDOW_SECONDS = 15 * 60;

/**
 * Header the Worker stamps on a socket it admitted, naming the password generation
 * it checked. Always overwritten, never forwarded from the client: the room trusts it.
 */
export const ROOM_GEN_HEADER = 'X-MarkLayer-Room-Gen';

export type RoomAccess =
  | { open: true; gen: number; guarded: boolean }
  | { open: false; reason: 'locked' | 'wrong' | 'throttled' };

export type Attempt = 'ok' | 'wrong' | 'throttled';

/** `Authorization: Bearer <password>` for MCP clients, the custom header for anything that cannot set one. */
export function presentedPassword(headers: Headers): string | null {
  const auth = headers.get('Authorization');
  if (auth?.startsWith('Bearer ')) {
    const value = auth.slice('Bearer '.length).trim();
    if (value) return value;
  }
  return headers.get(ROOM_PASSWORD_HEADER) || null;
}

/** A digest, so the failure table never holds an address. */
function clientKey(headers: Headers): Promise<string> {
  return sha256Hex(headers.get('cf-connecting-ip') ?? 'unknown');
}

/**
 * One guess. The throttle is read before the derivation runs, so a client over
 * the limit learns nothing even by guessing right; only a wrong guess counts.
 */
export async function attemptPassword({
  db,
  roomId,
  record,
  password,
  headers,
}: {
  db: D1Database;
  roomId: string;
  record: string;
  password: string;
  headers: Headers;
}): Promise<Attempt> {
  const failures = unlockFailureStore(db);
  const client = await clientKey(headers);
  const now = nowInSeconds();
  const since = now - FAILURE_WINDOW_SECONDS;
  if ((await failures.count({ roomId, client, since })) >= MAX_FAILURES) return 'throttled';
  if (await verifyPassword({ password, record })) return 'ok';
  await failures.record({ roomId, client, now, since });
  return 'wrong';
}

/**
 * The rule every reader of a room's content asks, in cheapest-first order: an
 * open link, a valid unlock cookie, the owner's own session, then a presented
 * password. `user` is lazy and shared so a project gate resolves the session once.
 */
async function decide({
  db,
  id,
  lock,
  headers,
  user,
}: {
  db: D1Database;
  id: string;
  lock: RoomLock;
  headers: Headers;
  user: () => Promise<SessionUser | null>;
}): Promise<RoomAccess> {
  const record = lock.passwordHash;
  if (!record) return { open: true, gen: lock.passwordGen, guarded: false };

  const cookie = parseCookieHeader(headers.get('Cookie') ?? '', unlockCookieName(id))[unlockCookieName(id)];
  if (
    cookie &&
    (await verifyUnlock({ token: cookie, roomId: id, gen: lock.passwordGen, record, now: nowInSeconds() }))
  ) {
    return { open: true, gen: lock.passwordGen, guarded: true };
  }

  if (lock.ownerId !== null && (await user())?.id === lock.ownerId)
    return { open: true, gen: lock.passwordGen, guarded: true };

  const password = presentedPassword(headers);
  if (!password) return { open: false, reason: 'locked' };
  const attempt = await attemptPassword({ db, roomId: id, record, password, headers });
  return attempt === 'ok' ? { open: true, gen: lock.passwordGen, guarded: true } : { open: false, reason: attempt };
}

function lazyUser({ db, headers }: { db: D1Database; headers: Headers }): () => Promise<SessionUser | null> {
  let pending: Promise<SessionUser | null> | null = null;
  return () => {
    pending ??= userFromCookieHeader({ header: headers.get('Cookie'), db });
    return pending;
  };
}

/** May this request read or write room `id`? A missing room is open: there is nothing in it to protect. */
export async function roomAccess({
  db,
  id,
  headers,
}: {
  db: D1Database;
  id: string;
  headers: Headers;
}): Promise<RoomAccess> {
  const lock = await annotationStore(db).getLock(id);
  if (!lock) return { open: true, gen: 0, guarded: false };
  return decide({ db, id, lock, headers, user: lazyUser({ db, headers }) });
}

/**
 * Which of a project's pages this request may not see, in page order. A
 * presented password is not tried here: each page has its own, and one header
 * cannot answer several prompts.
 */
export async function lockedPages({
  db,
  pageIds,
  headers,
}: {
  db: D1Database;
  pageIds: string[];
  headers: Headers;
}): Promise<string[]> {
  const locks = await annotationStore(db).getLocks(pageIds);
  if (locks.size === 0) return [];
  const user = lazyUser({ db, headers });
  const bare = new Headers(headers);
  bare.delete('Authorization');
  bare.delete(ROOM_PASSWORD_HEADER);
  const locked: string[] = [];
  for (const id of pageIds) {
    const lock = locks.get(id);
    if (lock && !(await decide({ db, id, lock, headers: bare, user })).open) locked.push(id);
  }
  return locked;
}

/** What a closed room answers. Names the remedy, never anything about the room. */
export function lockedError(access: Exclude<RoomAccess, { open: true }>): { status: 401 | 429; error: string } {
  if (access.reason === 'throttled') {
    return { status: 429, error: 'Too many wrong passwords. Try again in 15 minutes.' };
  }
  return {
    status: 401,
    error:
      access.reason === 'wrong'
        ? 'Wrong password for this link.'
        : 'This link is password protected. Send the password as `Authorization: Bearer <password>`.',
  };
}

export function lockedJson(access: Exclude<RoomAccess, { open: true }>): Response {
  const { status, error } = lockedError(access);
  return Response.json({ error }, { status });
}

/** The cookie a correct password earns, ready for Hono's `setCookie`. */
export async function unlockCookie({
  roomId,
  gen,
  record,
  secure,
}: {
  roomId: string;
  gen: number;
  record: string;
  secure: boolean;
}) {
  const value = await signUnlock({ roomId, gen, record, expiresAt: nowInSeconds() + UNLOCK_TTL_SECONDS });
  return {
    name: unlockCookieName(roomId),
    value,
    options: { httpOnly: true, secure, sameSite: 'Lax', path: '/', maxAge: UNLOCK_TTL_SECONDS } as const,
  };
}

/**
 * Refuses a socket the way a browser can read. A plain 401 on the upgrade
 * surfaces as close code 1006, indistinguishable from a network drop, and the
 * client would retry forever; accepting and closing with 4401 tells it to stop.
 */
export function lockedSocket(): Response {
  const pair = new WebSocketPair();
  const server = pair[1];
  server.accept();
  server.close(ROOM_LOCKED_CLOSE_CODE, 'password required');
  return new Response(null, { status: 101, webSocket: pair[0] });
}
