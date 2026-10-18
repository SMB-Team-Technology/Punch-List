import mcpPkg from '../../../mcp/package.json';
import { ORIGIN } from './site';

/**
 * The agent-facing well-known surface, in one place.
 *
 * These documents are served twice: from this static site (and its standalone
 * Pages deploy) and from the Worker, which claims the same paths via
 * `run_worker_first`. Both sides read this module and the sibling
 * `content/agent/*` files, so the Worker copy can never advertise a different
 * spec, tool list or digest than the site does.
 */

/** The tool contract's version, read from apps/mcp/package.json; this fork publishes nothing to npm. */
export const MCP_VERSION: string = mcpPkg.version;

export const SKILL_PATH = '/.well-known/agent-skills/marklayer-annotations/SKILL.md';

const SKILL_DESCRIPTION =
  'Create Punch List feedback links over a no-auth HTTP API, and work through the comments left on a website as a queue over MCP, at the share link’s own /mcp address.';

/** RFC 9727 API catalog: points agents at the share API's spec, docs and health check. */
export const API_CATALOG = {
  linkset: [
    {
      anchor: `${ORIGIN}/api`,
      'service-desc': [{ href: `${ORIGIN}/api/openapi.json`, type: 'application/vnd.oai.openapi+json;version=3.1.0' }],
      'service-doc': [{ href: `${ORIGIN}/llms-full.txt`, type: 'text/markdown' }],
      status: [{ href: `${ORIGIN}/api/health` }],
    },
  ],
};

/** The install for one share link, with the id left for the reader to fill. */
export const MCP_INSTALL = `claude mcp add --transport http marklayer ${ORIGIN}/s/<id>/mcp`;

/**
 * MCP Server Card (SEP-1649). The endpoint is per room, so it goes in the
 * registry's `remotes` shape with the room as a URL variable; this fork ships no
 * stdio package. server-card.test.ts pins `tools`.
 */
export const MCP_SERVER_CARD = {
  serverInfo: { name: 'marklayer-mcp', title: 'Punch List by SMB Team', version: MCP_VERSION },
  remotes: [
    {
      type: 'streamable-http',
      url: `${ORIGIN}/s/{room}/mcp`,
      install: `claude mcp add --transport http marklayer ${ORIGIN}/s/{room}/mcp`,
      variables: {
        room: {
          description: `The id in a share link (${ORIGIN}/s/{room}). The endpoint serves that one room, so it has every tool but marklayer_connect_room.`,
          isRequired: true,
        },
      },
    },
  ],
  capabilities: { tools: true, resources: false, prompts: false },
  tools: [
    'marklayer_read_page',
    'marklayer_connect_room',
    'marklayer_room_info',
    'marklayer_list_annotations',
    'marklayer_get_annotation',
    'marklayer_watch_annotations',
    'marklayer_acknowledge',
    'marklayer_resolve',
    'marklayer_dismiss',
    'marklayer_reply',
    'marklayer_create_annotation',
    'marklayer_suggest_edit',
    'marklayer_share_preview',
    'marklayer_set_next_steps',
    'marklayer_complete_next_step',
    'marklayer_ask',
    'marklayer_get_feedback',
  ],
  documentation: `${ORIGIN}/mcp`,
};

/**
 * Agent Skills Discovery RFC v0.2.0 index. The digest is always derived from
 * the same SKILL.md bytes the caller serves, so editing the skill text can
 * never leave the index advertising a stale hash.
 */
export function skillIndex(digest: string) {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'marklayer-annotations',
        type: 'skill-md',
        description: SKILL_DESCRIPTION,
        url: `${ORIGIN}${SKILL_PATH}`,
        digest,
      },
    ],
  };
}
