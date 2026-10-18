import type { APIRoute } from 'astro';
import dates from '../data/page-dates.json';
import { ORIGIN } from '../lib/site';

type Entry = { path: string; lastmod: string; changefreq: string; priority: string };

const url = ({ path, lastmod, changefreq, priority }: Entry): string =>
  `  <url><loc>${ORIGIN}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

/**
 * Owned by the site rather than the Worker, so the page list lives in one place.
 * Only indexable pages belong in it: llms.txt and llms-full.txt are for agents, not
 * search results, and listing them only invites a "crawled, not indexed" report.
 */
export const GET: APIRoute = () => {
  const entries: Entry[] = [
    { path: '/', lastmod: dates.home.modified, changefreq: 'weekly', priority: '1.0' },
    { path: '/help', lastmod: dates.help.modified, changefreq: 'monthly', priority: '0.8' },
    { path: '/mcp', lastmod: dates.mcp.modified, changefreq: 'monthly', priority: '0.6' },
    { path: '/privacy', lastmod: dates.privacy.modified, changefreq: 'monthly', priority: '0.3' },
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(url).join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
