/**
 * Query parameters that only ever identify the click that led to a page, never
 * the page: Google's cross-domain linker, the usual campaign tags and the ad
 * click ids. Left on, every click through a site looked like a new page.
 */
const TRACKING_PARAMS = new Set([
  '_gl',
  '_ga',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  'igshid',
  'yclid',
  'ttclid',
  'srsltid',
]);

/**
 * A page's address without its tracking tags or fragment — the address to load.
 *
 * The trailing slash is kept: on the Astro sites served from Cloud Storage,
 * `/about` is a redirect stub and only `/about/` is the page. Stripping it sent
 * every nav click to the stub.
 */
export function cleanPageUrl(raw: string): string {
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key) || key.startsWith('utm_')) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString();
  } catch {
    return raw;
  }
}

/** What two links to one page share: `/about` and `/about/` are one page on every site anyone reviews. */
export function pageKey(raw: string): string {
  const clean = cleanPageUrl(raw);
  try {
    const url = new URL(clean);
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
    return url.toString();
  } catch {
    return clean;
  }
}
