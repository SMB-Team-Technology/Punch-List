import { AGENCY_NAME, AGENCY_URL, OG_IMAGE, ORIGIN } from './site';

export type Crumb = { name: string; path?: string };
export type QA = { q: string; a: string };

const AGENCY = { '@type': 'Organization', name: AGENCY_NAME, url: AGENCY_URL } as const;

// Google's Rich Results Test rejects a bare day as a DateTime and asks for a zone.
// Content only records the day, so it is pinned to UTC midnight.
const dateTime = (day: string) => (/^\d{4}-\d{2}-\d{2}$/.test(day) ? `${day}T00:00:00Z` : day);

export function articleSchema(p: {
  h1: string;
  description: string;
  path: string;
  published: string;
  modified: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.h1,
    description: p.description,
    datePublished: dateTime(p.published),
    dateModified: dateTime(p.modified),
    author: AGENCY,
    publisher: { ...AGENCY, logo: { '@type': 'ImageObject', url: `${ORIGIN}/favicon.svg` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}${p.path}` },
    image: { '@type': 'ImageObject', url: OG_IMAGE },
  };
}

// A FAQPage with an empty mainEntity fails validation outright — guard it here
// instead of trusting every call site to only pass non-empty content.
export function faqSchema(qa: QA[]): object | null {
  if (qa.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbSchema(items: Crumb[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => {
      const entry: Record<string, unknown> = { '@type': 'ListItem', position: i + 1, name: it.name };
      if (it.path) entry.item = `${ORIGIN}${it.path}`;
      return entry;
    }),
  };
}

export function howToSchema(p: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}): object | null {
  if (p.steps.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: p.name,
    description: p.description,
    step: p.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
