# Slack app (two-way sync)

Each new annotation in a room posts to a Slack channel as a thread parent.
Replies in MarkLayer post into that thread, and a person's reply in the Slack
thread comes back as a reply on the annotation.

The older outbound-only incoming webhook (the "Slack" row in Integrations) still
works and is unrelated. A room can use both, but then every comment posts twice.

Code: `src/integrations/slack-app.ts` (signing, state, crypto, Web API calls),
`slack-routes.ts` (HTTP), `slack-sync.ts` (outbound batch, inbound reply),
`slack-store.ts` (D1, `migrations/0011_add_slack_installs.sql`).

## Endpoints

| Path | Purpose |
| --- | --- |
| `GET /integrations/slack/install?room=<id>` | Starts OAuth. Needs edit rights on the room (the owner, on a view-only link). |
| `GET /integrations/slack/callback` | OAuth redirect URL. Verifies `state`, stores the encrypted bot token, joins the channel. |
| `POST /integrations/slack/events` | Events API request URL. |
| `GET /integrations/slack/status?room=<id>` | What the settings panel shows. |
| `DELETE /integrations/slack?room=<id>` | Disconnects the room. |

`/integrations/*` is in `assets.run_worker_first` in `wrangler.jsonc`; without
it these paths never reach the Worker.

## App manifest

Create the app at <https://api.slack.com/apps> → **Create New App** → **From a
manifest**, and paste this. For a staging deploy, replace `feedback.smbteam.com` in
both URLs.

```yaml
display_information:
  name: MarkLayer
  description: Annotation threads from MarkLayer, synced both ways.
features:
  bot_user:
    display_name: MarkLayer
    always_online: false
oauth_config:
  redirect_urls:
    - https://feedback.smbteam.com/integrations/slack/callback
  scopes:
    bot:
      - chat:write         # post parents and threaded replies
      - channels:history   # receive message.channels (thread replies, public channels)
      - groups:history     # receive message.groups (thread replies, private channels)
      - channels:join      # join the chosen public channel after install
      - users:read         # show a Slack reply under the person's name
      - incoming-webhook   # the channel picker on the install screen
settings:
  event_subscriptions:
    request_url: https://feedback.smbteam.com/integrations/slack/events
    bot_events:
      - message.channels
      - message.groups
      - app_uninstalled
      - tokens_revoked
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false
```

Token rotation must stay off: the Worker stores one long-lived bot token per
room and has no refresh path.

The scopes are also listed in `SLACK_SCOPES` in `slack-app.ts`, which is what
the install URL actually requests. Keep the two in step.

## Secrets

All four are required. Any one unset turns the feature off: every route above
answers 404 and the settings panel hides the row.

```sh
cd apps/worker
bunx wrangler secret put SLACK_CLIENT_ID       # Basic Information → App Credentials
bunx wrangler secret put SLACK_CLIENT_SECRET   # same page; also signs the OAuth state
bunx wrangler secret put SLACK_SIGNING_SECRET  # same page; verifies every Events API request
openssl rand -base64 32 | bunx wrangler secret put SLACK_TOKEN_KEY
```

`SLACK_TOKEN_KEY` is the AES-GCM key bot tokens are sealed under in D1, with the
room id as associated data. Rotating it makes every stored token undecryptable,
so every room has to reconnect.

For local dev, put the same four in `apps/worker/.dev.vars`. Slack has to reach
the events URL, so use a tunnel (`cloudflared tunnel --url http://localhost:5173`)
and point a separate dev app's redirect and request URLs at it.

## Setup steps

1. Apply the migration: `cd apps/worker && bunx wrangler d1 migrations apply marklayer --remote`.
2. Create the app from the manifest above.
3. Set the four secrets, then `bun run deploy`.
4. In the app's **Event Subscriptions**, confirm the request URL shows
   *Verified* (Slack sends `url_verification`, which needs the signing secret live).
5. To let other workspaces install it: **Manage Distribution** → activate
   public distribution. Until then only the app's own workspace can install.
6. In a room: Settings → Integrations → **Slack, two-way** → Set up, pick a channel.

## Behaviour

- **State.** `state` is HMAC-signed with the client secret and carries the room,
  the installer's user id and a nonce. The nonce is also set as an HttpOnly cookie
  on `/integrations/slack`, so a state started in one browser cannot finish in
  another. It expires after 10 minutes.
- **Private channels.** `conversations.join` only works for public channels. For
  a private channel, run `/invite @MarkLayer` there, or replies will not arrive.
- **Outbound.** Rides the room's 3s flush alarm. A new comment (or area,
  selection or element note with text) posts as a parent; a reply posts into its
  parent's thread, opening one first if the parent was never posted. Attachment
  links are included. Three flushes in a row with every post failing stop the
  room trying until it restarts.
- **Inbound.** Every request's `X-Slack-Signature` is checked (HMAC-SHA256,
  constant-time) and anything more than 5 minutes old is refused. The response
  is an immediate 200 and the work runs in `waitUntil`. Only a human's threaded
  reply is used: anything with `bot_id` or a `subtype`, or posted by the install's
  own bot user, is dropped, which is what prevents echo loops. The reply op's id
  comes from the Slack message, so a redelivered event writes nothing new, and
  ops with that id prefix are never posted back to Slack.
- **Access.** A Slack reply is written through the same Durable Object call the
  MCP `reply` tool uses, so it respects a view-only link the same way.
- **Uninstall.** `app_uninstalled` and `tokens_revoked` delete every install for
  that workspace. The daily retention cron deletes installs and thread rows whose
  room is gone.
