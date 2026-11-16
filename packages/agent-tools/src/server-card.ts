import { ORIGIN } from '@marklayer/brand';
import { mcpAddCommand, mcpEndpoint, sharePath } from '@marklayer/brand/links';
import { version } from '../package.json' with { type: 'json' };
import { toolsFor } from './tools';

/** What both servers announce. A literal here fell three releases behind once; keep this package's version on the npm package's. */
export const MCP_SERVER_VERSION: string = version;

/** The install for one share link, with the id left for the reader to fill; this fork ships no stdio package. */
export const MCP_INSTALL = mcpAddCommand({ roomId: '<id>' });

const ROOM_VARIABLE = '{room}';

/**
 * MCP Server Card (SEP-1649). The Streamable-HTTP endpoint is per room, so it goes
 * in the registry's `remotes` shape with the room as a URL variable; this fork
 * publishes no stdio package to npm. It advertises what HTTP can call: a card is read
 * before anything connects, and `marklayer_connect_room` has no meaning there.
 */
export const MCP_SERVER_CARD = {
  serverInfo: { name: 'marklayer-mcp', title: 'Punch List by SMB Team', version: MCP_SERVER_VERSION },
  remotes: [
    {
      type: 'streamable-http',
      url: mcpEndpoint({ roomId: ROOM_VARIABLE }),
      install: mcpAddCommand({ roomId: ROOM_VARIABLE }),
      variables: {
        room: {
          description: `The id in a share link (${ORIGIN}${sharePath(ROOM_VARIABLE)}). The endpoint serves that one room, so it has every tool but marklayer_connect_room.`,
          isRequired: true,
        },
      },
    },
  ],
  capabilities: { tools: true, resources: false, prompts: false },
  tools: toolsFor('http').map((tool) => tool.name),
  documentation: `${ORIGIN}/mcp`,
};
