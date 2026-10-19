import { Database } from 'bun:sqlite';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { type HostLookupDb, mayProxyHost, resetKnownHosts } from './proxy-gate';

/** Real SQLite behind `prepare().bind().first()`, so the host match runs as SQL. */
function sqliteDb(sqlite: Database): HostLookupDb {
  return {
    prepare: (sql) => ({
      bind: (...args) => ({ first: async () => sqlite.query(sql).get(...args) }),
    }),
  };
}

const GATED = { TEAM_EMAIL_DOMAINS: 'smbteam.com' };
const stranger = async () => false;
const teammate = async () => true;

describe('mayProxyHost', () => {
  let db: HostLookupDb;
  beforeEach(() => {
    const sqlite = new Database(':memory:');
    sqlite.exec('CREATE TABLE annotations (id TEXT PRIMARY KEY, ops TEXT, url TEXT)');
    sqlite.exec(
      "INSERT INTO annotations VALUES ('a', '[]', 'https://client.com/about'), ('b', '[]', 'https://bare.org')",
    );
    db = sqliteDb(sqlite);
  });
  afterEach(resetKnownHosts);

  test('ungated deployments proxy anything, as upstream does', async () => {
    expect(await mayProxyHost({ env: {}, host: 'evil.example', isTeam: stranger })).toBe(true);
  });

  test('a host with a board passes, in any case', async () => {
    const env = { ...GATED, DB: db };
    expect(await mayProxyHost({ env, host: 'client.com', isTeam: stranger })).toBe(true);
    expect(await mayProxyHost({ env, host: 'CLIENT.com', isTeam: stranger })).toBe(true);
    expect(await mayProxyHost({ env, host: 'bare.org', isTeam: stranger })).toBe(true);
  });

  test('a host without one is refused, lookalikes included', async () => {
    for (const host of ['evil.example', 'client.co', 'client.com.evil.example', 'bare.or']) {
      expect(await mayProxyHost({ env: { ...GATED, DB: db }, host, isTeam: stranger })).toBe(false);
    }
  });

  test('the team may preview a site before it has a board', async () => {
    expect(await mayProxyHost({ env: { ...GATED, DB: db }, host: 'new-client.com', isTeam: teammate })).toBe(true);
  });

  test('the team is not asked about a host that already has a board', async () => {
    let asked = false;
    const isTeam = async () => {
      asked = true;
      return false;
    };
    await mayProxyHost({ env: { ...GATED, DB: db }, host: 'client.com', isTeam });
    expect(asked).toBe(false);
  });

  test('a gated deployment with no database refuses strangers rather than opening up', async () => {
    expect(await mayProxyHost({ env: GATED, host: 'client.com', isTeam: stranger })).toBe(false);
  });
});
