export const ORIGIN = 'https://feedback.smbteam.com';
export const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/marklayer/fnfobegjifomgobgilaemihpcpidjamc';
/** The fallback card, for anything with no heading of its own to draw. */
export const OG_IMAGE = `${ORIGIN}/og.jpg`;

/**
 * A card drawn for one page: its own heading, set large, with a stroke under the
 * operative word and a comment pinned to it.
 *
 * Rendered by the Worker (`/og/page.png`) rather than baked at build time, because
 * that is where the fonts and the rasterizer already live. The heading travels in
 * the URL for the same reason: these pages are static, so the Worker has no copy
 * of their content to look up. The result is cached in R2 by the hash of both
 * params, so a given page renders once.
 */
export function pageOgImage({ heading, path }: { heading: string; path: string }): string {
  const query = new URLSearchParams({ h: heading, p: path });
  return `${ORIGIN}/og/page.png?${query}`;
}
/**
 * The cross-tab channel a thank-you page uses to tell an editor still open in
 * another tab that a payment landed. This fork no longer ships that page; the
 * app in apps/worker still listens, so the constant stays where it imports it.
 */
export const SUPPORT_CHANNEL = 'marklayer:support';
export const SUPPORT_PAID = 'paid';

/**
 * The Polar checkout the app's support card opens (apps/worker re-exports it from
 * `web/support.ts`). Left empty and every surface degrades to its no-payment form.
 */
export const POLAR_CHECKOUT_URL = 'https://buy.polar.sh/polar_cl_DBsDl9Ufd2O0mOEodJrcrIDpuOu2iEc0UqG4w4cXdk2';

export const REPO_URL = 'https://github.com/thevrus/MarkLayer';
export const CMS_URL = 'https://cms.smbteam.com';
export const AGENCY_NAME = 'SMB Team';
export const AGENCY_URL = 'https://smbteam.com';

/** apps/worker's Vite dev server, started alongside this one by `turbo run dev`. */
export const WORKER_DEV = 'http://localhost:5173';

/** The header's links, in the order it renders them. */
export const SECTIONS = [
  { key: 'help', label: 'Help', href: '/help' },
  { key: 'mcp', label: 'MCP for AI agents', href: '/mcp' },
] as const;

const LAST_UPDATED_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/** "2026-04-12" → "April 2026". Matches the byline format the Worker shipped. */
export function formatLastUpdated(iso: string): string {
  return LAST_UPDATED_FORMAT.format(new Date(`${iso}T00:00:00Z`));
}
