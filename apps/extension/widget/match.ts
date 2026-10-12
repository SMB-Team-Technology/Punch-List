/**
 * Which room a widget on this page belongs to. Kept free of DOM and fetch so the
 * loader stays tiny and the matching rule is testable on its own.
 */

/** A page's identity for matching: origin + path, with query, hash and a trailing slash ignored. */
export function pageKey(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return `${u.origin}${u.pathname.replace(/\/+$/, '')}`;
  } catch {
    return null;
  }
}

export function samePage({ a, b }: { a: string; b: string }): boolean {
  const key = pageKey(a);
  return key !== null && key === pageKey(b);
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** The room id from a `GET /api/:id` body, if it was made on this page. */
export function roomForPage({ id, body, href }: { id: string; body: unknown; href: string }): string | null {
  if (!isRecord(body) || typeof body.url !== 'string') return null;
  return samePage({ a: body.url, b: href }) ? id : null;
}

/** The page id from a `GET /api/p/:id` body whose URL is this page. */
export function projectPageForPage({ body, href }: { body: unknown; href: string }): string | null {
  if (!isRecord(body) || !Array.isArray(body.pages)) return null;
  for (const page of body.pages) {
    if (!isRecord(page) || typeof page.id !== 'string' || typeof page.url !== 'string') continue;
    if (samePage({ a: page.url, b: href })) return page.id;
  }
  return null;
}
