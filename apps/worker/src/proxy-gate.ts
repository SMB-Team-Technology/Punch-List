import { type TeamEnv, teamGated } from './auth/team';

/** The one query the gate runs; `D1Database` satisfies it, and so does a test's SQLite. */
export interface HostLookupDb {
  prepare(sql: string): { bind(...values: string[]): { first(): Promise<unknown> } };
}

/**
 * Which hosts the proxy will serve as a page. Upstream proxies any public URL,
 * which on a team deployment lets anyone put a stranger's login form under our
 * domain. With the team gate on, a host must already have a board (and only the
 * team can start one on a new site), or the request must come from the team.
 */
export interface ProxyGateEnv extends TeamEnv {
  DB?: HostLookupDb;
}

/** Hosts seen with a board, so a page's dozens of requests cost one query. */
const knownHosts = new Map<string, number>();
const KNOWN_FOR_MS = 5 * 60_000;

export async function mayProxyHost({
  env,
  host,
  isTeam,
}: {
  env: ProxyGateEnv;
  host: string;
  /** Asked only when the host has no board, since it costs a session lookup. */
  isTeam: () => Promise<boolean>;
}): Promise<boolean> {
  if (!teamGated(env)) return true;
  const h = host.toLowerCase();
  if ((knownHosts.get(h) ?? 0) > Date.now()) return true;
  if (env.DB) {
    // instr, not LIKE: `_` is legal in a hostname and a LIKE wildcard.
    const row = await env.DB.prepare(
      `SELECT 1 FROM annotations
       WHERE instr(url, ?1) = 1 OR instr(url, ?2) = 1 OR url = ?3 OR url = ?4
       LIMIT 1`,
    )
      .bind(`https://${h}/`, `http://${h}/`, `https://${h}`, `http://${h}`)
      .first();
    if (row) {
      knownHosts.set(h, Date.now() + KNOWN_FOR_MS);
      return true;
    }
  }
  return isTeam();
}

/** For tests: forget every host seen. */
export function resetKnownHosts(): void {
  knownHosts.clear();
}
