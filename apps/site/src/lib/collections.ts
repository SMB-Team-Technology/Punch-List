import { getCollection } from 'astro:content';

/**
 * Releases, newest first. Sorted on the version rather than on `date`, because
 * two versions can share a day — and numerically, because a plain string compare
 * puts 0.10.0 before 0.9.0.
 */
export const getReleases = async () =>
  [...(await getCollection('releases'))].sort((a, b) =>
    b.data.version.localeCompare(a.data.version, undefined, { numeric: true }),
  );

/**
 * The published version number, from the newest release. Every surface that
 * states a version — the home page's `softwareVersion`, `llms.txt` — reads it
 * here, so none of them can drift.
 */
export const getCurrentVersion = async (): Promise<string> => {
  const version = (await getReleases()).at(0)?.data.version;
  if (!version) throw new Error('collections: no releases to take the current version from');
  return version;
};
