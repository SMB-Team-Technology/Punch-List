export interface DocLink {
  href: string;
  /** The short sidebar label. */
  label: string;
  /** The page's own heading, which search results and the pager show in full. */
  title: string;
  /** Matched by search alongside the title; never rendered. */
  keywords: string;
}

export interface DocGroup {
  label: string;
  links: DocLink[];
}

export type DocsNav = DocGroup[];

/**
 * The sidebar, the search index and the pager, from one list. Every docs page
 * appears exactly once, so a page cannot be findable in search yet missing from
 * the sidebar, or the reverse.
 */
const DOCS_NAV: DocsNav = [
  {
    label: 'Docs',
    links: [
      {
        href: '/help',
        label: 'Help',
        title: 'How to leave feedback on your new website',
        keywords: 'help comment reply status name phone mobile device preview client review',
      },
      {
        href: '/mcp',
        label: 'MCP for AI agents',
        title: 'Connect Punch List to your coding agent',
        keywords: 'mcp claude code cursor codex vs code agent setup',
      },
    ],
  },
];

export const getDocsNav = (): Promise<DocsNav> => Promise.resolve(DOCS_NAV);

export const isCurrent = ({ href, path }: { href: string; path: string }): boolean => href === path;
