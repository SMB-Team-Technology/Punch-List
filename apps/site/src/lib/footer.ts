import claudeSvg from '@lobehub/icons-static-svg/icons/claude.svg?raw';
import geminiSvg from '@lobehub/icons-static-svg/icons/gemini.svg?raw';
import grokSvg from '@lobehub/icons-static-svg/icons/grok.svg?raw';
import openaiSvg from '@lobehub/icons-static-svg/icons/openai.svg?raw';
import perplexitySvg from '@lobehub/icons-static-svg/icons/perplexity.svg?raw';
import { CMS_URL, REPO_URL } from './site';

/**
 * The site's floor, as data.
 *
 * There are two renderers — SiteFooter.astro for the prerendered marketing
 * pages and the <footer> in apps/worker/web/Landing.tsx for the app shell at
 * `/` — and they used to carry different columns, different labels and a
 * different colophon, so the footer changed shape the moment you clicked out of
 * `/`. Neither framework can import the other's component, but both can import
 * this, so the CONTENT has one source and only the container width differs.
 *
 * apps/site/scripts/verify-build.mjs resolves every internal href in the built
 * HTML, so a path that stops existing fails the build rather than shipping.
 */

export interface FooterLink {
  href: string;
  label: string;
  /** Off-origin. Rendered with `target="_blank" rel="noopener noreferrer"`. */
  external?: boolean;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

/** Mirrors `HOW_IT_WORKS_PATH` in apps/extension/lib/share.ts, which apps/site cannot import. */
const HELP = '/help';

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Punch List',
    links: [
      { href: '/', label: 'Home' },
      { href: HELP, label: 'Help' },
      { href: '/mcp', label: 'MCP for AI agents' },
    ],
  },
  {
    heading: 'SMB Team',
    links: [
      { href: CMS_URL, label: 'smbCMS', external: true },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
];

/**
 * Brand marks from @lobehub/icons-static-svg (simple-icons dropped OpenAI and
 * Grok). Single-path 24×24, drawn in `currentColor` so they take the same faint
 * → ink hover as every other row icon, and `evenodd` — the files rely on it for
 * their counters. Bare, with padding for the hit area only — no tile.
 */
const markPath = (svg: string): string => svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1] ?? '';

const PROVIDERS: { label: string; url: (encodedQuestion: string) => string; path: string }[] = [
  {
    label: 'ChatGPT',
    url: (q) => `https://chatgpt.com/?hints=search&q=${q}`,
    path: markPath(openaiSvg),
  },
  {
    label: 'Claude',
    url: (q) => `https://claude.ai/new?q=${q}`,
    path: markPath(claudeSvg),
  },
  {
    label: 'Perplexity',
    url: (q) => `https://www.perplexity.ai/search?q=${q}`,
    path: markPath(perplexitySvg),
  },
  {
    /* Google AI Mode is Gemini, so the mark is Gemini's; `udm=50` is the
       parameter that opens AI Mode rather than the ten blue links. */
    label: 'Google Gemini',
    url: (q) => `https://www.google.com/search?udm=50&q=${q}`,
    path: markPath(geminiSvg),
  },
  {
    label: 'Grok',
    url: (q) => `https://grok.com/?q=${q}`,
    path: markPath(grokSvg),
  },
];

/** The assistants' deep links for `question`: an article offers to be read by one. */
export const askAi = (question: string): { href: string; label: string; path: string }[] =>
  PROVIDERS.map(({ label, url, path }) => ({ label, href: url(encodeURIComponent(question)), path }));

/** Apache-2.0 grants no trademark rights, so the fork says plainly whose name MarkLayer is. */
export const TRADEMARK_NOTICE =
  'Punch List is built on MarkLayer, open source under the Apache-2.0 licence. SMB Team is not affiliated with, endorsed by, or sponsored by the MarkLayer project.';

/** The licence attribution the colophon carries. Required: do not drop it. */
export const ATTRIBUTION = { label: 'Built on MarkLayer, Apache-2.0', href: REPO_URL };

/** The colophon, after the year, as plain text for renderers that do not link the attribution. */
export const COLOPHON = `Punch List by SMB Team · ${ATTRIBUTION.label}.`;
