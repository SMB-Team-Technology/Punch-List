import { ORIGIN, WORKER_DEV_PORT } from '@marklayer/brand';
import { pageOgImage as pageOgImageUrl } from '@marklayer/brand/links';

/** The fallback card, for anything with no heading of its own to draw. */
export const OG_IMAGE = `${ORIGIN}/og.jpg`;

/** A card the Worker draws for one page (`/og/page.png`): its heading, set large, with a stroke under the operative word. */
export function pageOgImage({ heading, path }: { heading: string; path: string }): string {
  return pageOgImageUrl.build({ heading, path });
}

export const REPO_URL = 'https://github.com/thevrus/MarkLayer';
export const CMS_URL = 'https://cms.smbteam.com';
export const AGENCY_NAME = 'SMB Team';
export const AGENCY_URL = 'https://smbteam.com';

/** apps/worker's Vite dev server, started alongside this one by `turbo run dev`. */
export const WORKER_DEV = `http://localhost:${WORKER_DEV_PORT}`;

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
