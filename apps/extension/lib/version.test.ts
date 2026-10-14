import { describe, expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pkg from '../package.json';

const releasesDir = join(import.meta.dir, '../../site/src/content/releases');

describe('extension version', () => {
  // WXT stamps the manifest from package.json; the site states the version from its
  // newest release note. A bump to one without the other ships a store build the
  // changelog doesn't describe, or a changelog for a build nobody can install.
  test('matches the newest release note on the site', () => {
    const versions = readdirSync(releasesDir).flatMap((file) => {
      const version = readFileSync(join(releasesDir, file), 'utf8').match(/^version: '([^']+)'$/m)?.[1];
      return version ? [version] : [];
    });
    const newest = versions.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0];
    expect(pkg.version).toBe(newest ?? 'no release notes found');
  });
});
