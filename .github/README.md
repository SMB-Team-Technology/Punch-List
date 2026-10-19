<!--
  GitHub shows .github/README.md ahead of the root README.md. The root file is
  upstream MarkLayer's and stays untouched so upstream merges never conflict on it;
  edit this one instead.
-->

<p align="center">
  <a href="https://feedback.smbteam.com">
    <img src="../apps/site/public/favicon.svg" width="96" height="96" alt="Punch List mark: a green check in a navy tile">
  </a>
</p>

<h1 align="center">Punch List</h1>

<p align="center"><strong>Mark it up. We'll knock it out.</strong></p>

<p align="center">
  Website review for SMB Team clients. Open the link to your new site, click anywhere on the page and leave a note.
  Every note lands on the team's punch list, and you watch each one get checked off.
</p>

<p align="center">
  <a href="https://feedback.smbteam.com"><strong>feedback.smbteam.com</strong></a> ·
  <a href="https://feedback.smbteam.com/help">Help</a> ·
  <a href="https://feedback.smbteam.com/mcp">Connect an agent</a>
</p>

## How it works

- **SMB Team staff** sign in with an `@smbteam.com` address and start a board for a client's site. Only team addresses can create boards, projects or previews (`TEAM_EMAIL_DOMAINS` in `apps/worker/wrangler.jsonc`).
- **Clients** open the share link with no account. They comment, draw and highlight right on the live page, and can click through to other pages of the same site.
- **Notes are open (green) until done (navy).** Status, priority and replies sync live to everyone on the board.
- **AI coding agents** can work the list directly: every share link is also an MCP server at `https://feedback.smbteam.com/s/<id>/mcp` (Streamable HTTP, nothing to install). An agent can watch, acknowledge, reply to and resolve notes while the team watches.

## Development

Requires [Bun](https://bun.sh).

```bash
bun install      # first-time setup
bun run dev      # all apps in dev mode (Turbo)
bun run check    # type-check
bun run lint     # Biome lint + format check
bun run test     # specs in the workspaces that have them
```

| Path | What it is |
|---|---|
| `apps/worker` | Cloudflare Worker: API, realtime rooms (Durable Objects), iframe proxy, the web app and the `/s/:id/mcp` endpoint |
| `apps/site` | Static Astro site: home, help, privacy, `/mcp`, 404 (embedded into the Worker at build time) |
| `apps/mcp` | Stdio MCP server, for clients that only run local servers |
| `apps/fetcher` | Optional fixed-IP relay for sites that block Cloudflare's egress |
| `packages/types` | Shared Zod schemas and types |
| `packages/agent-tools` | The MCP tool contract shared by both transports |

`CLAUDE.md` has the full conventions and architecture notes.

### Deploying

`bun run deploy` loses the `CLOUDFLARE_*` environment through Turbo, so deploy in two steps:

```bash
bun run build
cd apps/worker && bunx wrangler deploy
```

D1 schema changes go in `apps/worker/migrations/`, then `bunx wrangler d1 migrations apply marklayer --remote` from `apps/worker`.

## Branches and upstream

- `main` mirrors upstream [MarkLayer](https://github.com/thevrus/MarkLayer) and is never committed to directly.
- All Punch List work lives on `deploy/feedback`. Merge `upstream/main` into it, never the reverse.
- Upstream identifiers (`marklayer_*` tool ids, `@marklayer/*` packages, `ml-` classes, D1/R2 names, file names) are kept on purpose so those merges stay cheap. Only user-visible text, origins and branding change.

## License

Built on [MarkLayer](https://github.com/thevrus/MarkLayer), Apache-2.0. See [LICENSE](../LICENSE).
