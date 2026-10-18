import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * YAML turns an unquoted `2026-02-22` into a Date but a quoted `"2026-02-22"`
 * into a string. Accept both so hand-edited frontmatter cannot silently change
 * a page's `datePublished`, and normalise to a plain ISO day.
 */
const isoDate = z
  .union([z.string(), z.date()])
  .transform((value) => (typeof value === 'string' ? value : value.toISOString().slice(0, 10)));

/**
 * Shipped releases, one file per public version. The extension's version is the
 * product's public version number, so `version` here must match the value in
 * apps/extension/package.json for that release. No page renders them any more;
 * they are what `getCurrentVersion()` reads.
 *
 * These notes cover the TOOL only: what an annotator, a reviewer or an agent
 * can now do that they could not before. Infrastructure, refactors, CI, the
 * marketing site and internal plumbing are deliberately absent — a changelog
 * that lists a build-system change alongside a new drawing tool teaches a reader
 * to stop reading it.
 *
 * Every change is one entry in a single ordered `changes` list rather than three
 * separate arrays: the file then reads in the order the notes were written, and
 * the template does the grouping. `text` is required on all three kinds - a
 * release note that names a thing without saying what it does for you is a
 * commit subject, not a release note.
 */
const releases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/releases' }),
  schema: z.object({
    /** Dotted semver, e.g. "0.5.0". The slug is the filename (`v0-5-0`). */
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Must be a dotted semver, e.g. 0.5.0'),
    /** The release's name. Used as the h1 and as the hub's linked heading. */
    name: z.string(),
    date: isoDate,
    title: z.string(),
    description: z.string(),
    /** One or two sentences. The lede on the release page and the blurb on the hub. */
    summary: z.string(),
    changes: z
      .array(
        z.object({
          kind: z.enum(['new', 'improved', 'fixed']),
          title: z.string(),
          text: z.string(),
        }),
      )
      .min(1),
  }),
});

export const collections = { releases };
