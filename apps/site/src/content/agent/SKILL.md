---
name: marklayer-annotations
description: Work through the website feedback clients leave on a Punch List review link (comments, selections, areas, inspected elements) as a queue over MCP at the link's own /mcp address — read the page, watch for new work, acknowledge, resolve, dismiss, reply, leave your own comments and propose exact text edits as diffs, all with live status — and create review links over a no-auth HTTP API.
license: Apache-2.0
---

# Working with Punch List feedback

Punch List (https://feedback.smbteam.com) is where SMB Team's clients leave
feedback on the websites SMB Team builds for them. A client opens a review link,
clicks anything on the page and leaves a note; each link is a "room" addressed by
an unguessable id. There are two ways an agent works with it.

## 1. Work the feedback as a queue (MCP)

Every share link is a remote MCP server at the same address plus `/mcp`, so you
connect with nothing installed and no key (the link is the credential):

    claude mcp add --transport http marklayer https://feedback.smbteam.com/s/{id}/mcp

Append `?agent=<your-name>` so the humans see who is working. A password-protected
link takes `Authorization: Bearer <password>`. The endpoint is bound to its room,
so `marklayer_connect_room` is the one tool it does not have.

A room's `url` is not always a webpage. It can be a PDF or an image, served from
`/f/{id}`. Annotations on one record the page they were made on rather than a CSS
selector, and the `inspect` kind never appears there.

Each annotation carries a `kind` (comment | area | selection | inspect) and, where
the human marked an element, a `target` block with the CSS selector + markdown.
That is your handle for the code change; do not ask them to repeat what was clicked.

Typical loop:

1. `marklayer_list_annotations` to backfill anything pending (filter by status:
   open | in_progress | resolved | approved | dismissed | all).
2. `marklayer_watch_annotations` in a loop to receive new ones as they arrive.
3. For each: `marklayer_acknowledge` (marks in_progress so the client sees you are
   on it), make the change, then `marklayer_resolve` with a summary (posted as a
   reply). Use `marklayer_dismiss` with a reason when it cannot be acted on, and
   `marklayer_reply` to ask a clarifying question without changing status.

`approved` is the one status you never set: it is the person who asked for the
change confirming your fix. A resolved thread going back to open means they disagreed.

To take part rather than only respond:

- `marklayer_read_page` returns the page's headings, text, links and controls
  with their selectors, so you can review a page before anyone has commented.
- `marklayer_create_annotation` leaves a comment of your own, anchored to an
  element, with an optional priority.
- `marklayer_suggest_edit` proposes exact replacement text against the `rects`
  of a selection. The human sees a diff, so prefer it over describing a wording
  fix in a reply.

A comment carries fields worth reading before you act: `status`, `priority`
(low | medium | high | urgent), an `assignee` (which may be you), `mentions`, and
the browser, OS and viewport it was written on.

Per-client setup: https://feedback.smbteam.com/mcp.md

## 2. Create a review link (HTTP, no auth)

The id you POST to **is** the access token, so pick an unguessable string
(nanoid/uuid).

    POST https://feedback.smbteam.com/api/{id}
    Content-Type: application/json
    { "ops": [], "url": "https://example.com/page", "width": 1440, "expires_in": 2592000 }

- `ops`: annotation operations (`[]` for a blank page the client will comment on)
- `url`: the page the link opens and overlays
- `width`: reference viewport width in CSS px (1440 is a safe default)
- `expires_in`: seconds until cleanup (max 2592000 = 30 days). Omit for no fixed
  expiry: the link is deleted 90 days after its last access.

The link is then `https://feedback.smbteam.com/s/{id}`. Spec:
https://feedback.smbteam.com/api/openapi.json

## In-browser (WebMCP)

When a human opens a share link in a browser whose agent supports WebMCP, the
same actions (list / get / acknowledge / resolve / dismiss / reply) are exposed
on the page via `document.modelContext`.

Punch List is run by SMB Team (website@smbteam.com) and built on MarkLayer
(https://github.com/thevrus/MarkLayer), Apache-2.0.
