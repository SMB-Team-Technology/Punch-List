---
order: 23
title: "SimpleCommenter vs MarkLayer: $34.99/Month Widget vs Free"
description: "SimpleCommenter vs MarkLayer: SimpleCommenter is a $34.99 to $79 a month widget installed on each site. MarkLayer is free, with no script and no account."
intro: "MarkLayer is a free, open-source SimpleCommenter alternative: paste a URL, annotate the live page, share a link, and nobody on either side makes an account. SimpleCommenter is a hosted widget you add to each site with a script tag, a WordPress plugin, a Shopify app or its Chrome extension, then pay $34.99 or $79 a month for. MarkLayer has no plans or seat limits, and it also lacks SimpleCommenter's widget branding, routing rules and Jira status sync."
competitor: "SimpleCommenter"
competitorTagline: "a paid, hosted website commenting widget for agencies and freelancers, installed on each client site and managed from a dashboard"
homepage: "https://simplecommenter.com"
bottomLine: "Choose MarkLayer for free review of any page with nothing added to the site, live cursors, voice calls and an MCP server on every link. Choose SimpleCommenter if you want a widget living on the client's site in their colours, comments routed by rule into Asana, Jira or Linear, and SSO for a larger agency."
quote: "SimpleCommenter's Pro plan is $34.99 a month for three team members and ten projects, with extra seats at $9.99 each (checked October 2026). Agency is $79 a month with no caps. MarkLayer costs nothing, and the page you review needs no script before its closing body tag."
published: 2026-10-11
modified: 2026-10-11
rows:
  - feature: "Price"
    ml: "Free"
    them: "Pro $34.99/month (3 members, 10 projects, 50GB), extra seats $9.99/month; Agency $79/month (unlimited, 500GB); Enterprise on request. Annual billing gives two months free"
  - feature: "Free plan"
    ml: "Everything is free"
    them: "No. A 14-day trial with no card, and a refund within 14 days of payment"
  - feature: "Sign-up required"
    ml: "No, for anyone"
    them: "Yes for your team. Clients can review with or without a login, per project"
  - feature: "Install on the reviewed site"
    ml: "None. Paste the URL into the web app"
    them: "A script tag, the WordPress plugin, the Shopify app or its Chrome extension"
  - feature: "Apps behind a login"
    ml: "Via the free browser extension"
    them: "Via the widget installed in the app, or its Chrome extension"
  - feature: "What a comment captures"
    ml: "The element's CSS selector and markdown, position, and your screenshot or file"
    them: "Screenshot, browser, viewport and page URL, automatically"
  - feature: "Widget branding"
    ml: "No"
    them: "Yes. Match the widget to the site's colours, light or dark"
  - feature: "Real-time live cursors"
    ml: "Yes"
    them: "Not advertised"
  - feature: "Voice and video calls in the room"
    ml: "Yes, peer to peer"
    them: "No"
  - feature: "Kanban board"
    ml: "Yes, status columns on every link"
    them: "Statuses and priorities in a dashboard, with routing rules by mention, priority or status"
  - feature: "Issue tracker filing"
    ml: "One way. Files a Linear, GitHub or Jira issue or a Trello card; nothing syncs back"
    them: "Asana, Trello, Monday.com, ClickUp, Jira, GitHub and Linear. Its Jira page says a status change in Jira syncs back to the comment"
  - feature: "Chat notifications"
    ml: "Slack, Microsoft Teams, Discord or any webhook, free"
    them: "Slack, email and webhooks"
  - feature: "AI coding agent access (MCP)"
    ml: "Every share link is an MCP server, nothing to install. Agents can watch, resolve, reply, leave their own annotations and suggest text edits"
    them: "Hosted MCP with OAuth, or an npm stdio server. Read by default; reply and status changes if you grant write access. Trial and paid plans only"
  - feature: "Open source"
    ml: "Yes, Apache-2.0"
    them: "No"
  - feature: "Best for"
    ml: "Fast, free review of any page, with or without an agent on the other end"
    them: "Agencies that want a permanent feedback widget on every client site"
chooseMl:
  - "You want visual feedback that costs nothing, with no seat or project count to outgrow."
  - "You don't control the site you're reviewing, or you don't want to install a widget on it just to collect comments."
  - "You review together: live cursors and a voice call in the same room, instead of comments read later."
  - "You want an AI coding agent on the link itself, free, with no OAuth step and no plan requirement."
  - "You want open source you can read, audit or self-host on your own Cloudflare account."
chooseThem:
  - "You want the feedback button to live on the client's site permanently, in the client's colours."
  - "Comments must sort themselves into Asana, ClickUp, Jira or Linear by rule, with Jira status flowing back."
  - "Your agency needs SAML SSO, which SimpleCommenter sells as an Agency add-on."
  - "You sell on Shopify or WordPress and want a plugin that installs the widget without touching theme code."
faq:
  - q: "Is MarkLayer a free SimpleCommenter alternative?"
    a: "For annotating a live page and sharing a link, yes, and nobody on either side makes an account. It does not replace SimpleCommenter's on-site widget, its branded theme, its routing rules or its Jira status sync. I build MarkLayer, so read the rows above for what it lacks."
  - q: "How much does SimpleCommenter cost?"
    a: "Per its pricing page on 11 October 2026. Pro is $34.99 a month for three team members, ten projects, 50GB of storage and unlimited clients, with extra seats at $9.99 a month. Agency is $79 a month with unlimited members, projects and 500GB, plus optional SAML SSO at an extra 150 euros a month. Enterprise is custom. Annual billing gives two months free, but the annual figures are not printed. There is no free plan, only a 14-day trial with no card."
  - q: "Does the site I'm reviewing need anything installed?"
    a: "On SimpleCommenter, yes. The widget goes in with a script tag, the WordPress plugin, the Shopify app or its Chrome extension, so someone with access to the site adds it. On MarkLayer, no: paste the URL and the page is fetched and overlaid. For a page behind a login, the free MarkLayer browser extension annotates it in your own signed-in tab, still with nothing added to the site."
  - q: "How do the two MCP servers differ?"
    a: "SimpleCommenter's is hosted at simplecommenter.com/api/mcp with OAuth sign-in, or runs locally from the @simple-commenter/mcp-server npm package. Agents read open comments by default and can reply or change status, priority and tags only if you grant write access. It is included in the trial and paid plans. MarkLayer's is free with no key: every share link answers MCP at /s/<id>/mcp. An agent can watch a room live, acknowledge, resolve, dismiss or reply, leave its own comment pins and propose exact text edits the reviewer accepts as a diff."
  - q: "Do integrations sync both ways?"
    a: "On MarkLayer, no. It posts new comments to Slack, Teams, Discord or a webhook and files one thread as a Jira, Linear or GitHub issue, and that is the end of it. SimpleCommenter's integrations page describes pushing comments into Asana, Trello, Monday.com, ClickUp, Jira, GitHub and Linear. Its Jira page says a status change in Jira syncs back to the comment. The other tool pages do not state a direction."
  - q: "What happens to a MarkLayer link if nobody claims it?"
    a: "It is deleted 90 days after its last view, comment or edit, and any of those resets the clock. Claiming it with the free magic-link account removes the idle clock. SimpleCommenter keeps feedback as long as your subscription does."
---
## Where SimpleCommenter charges and MarkLayer doesn't

SimpleCommenter has no free plan. Pro is $34.99 a month and buys three team members, ten projects and 50GB. The fourth person costs $9.99 a month, and the eleventh client project moves you to Agency at $79. Both figures are the monthly rate; the annual toggle promises two months free without printing the number. The trial is 14 days with no card, and it does not roll into a subscription on its own.

MarkLayer has no seat count, project count or storage tier. A share link is the whole unit and you can mint as many as you want. What you give up is the structure: a dashboard listing every client project, per-client login settings, and the routing rules that send a high-priority comment to one board and a low one to another.

## The widget on the client's site

SimpleCommenter works by putting its widget on the page. That is a script tag, a WordPress plugin, a Shopify theme embed or its own Chrome extension. Once the widget is there, a client clicks an element and the screenshot, browser, viewport and URL are captured with the comment. The widget can be themed to the site, which is the right call for an agency that wants it to look like part of the deliverable.

MarkLayer fetches the page from its own server and overlays the canvas, so a public URL needs nothing at all. A page behind a password or a login needs the free browser extension, which annotates in the tab where you are already signed in. Neither route touches the site's code. The trade is permanence: SimpleCommenter's button stays on the site for the life of the project, while a MarkLayer room is a link you send.

## The agent on the other end

Both tools now talk to Claude Code, Cursor and other MCP clients. SimpleCommenter's server is hosted with OAuth, and you pick projects and allowed actions at sign-in, so read access is the default and writes are a deliberate grant. There is also a local stdio package whose tokens are account-wide. MCP is on the trial and paid plans, not after a trial lapses.

MarkLayer's is free and needs no key. Every share link is itself an MCP server, so `claude mcp add --transport http marklayer https://marklayer.app/s/<id>/mcp` is the whole setup. The agent watches the room live, acknowledges a thread so the reviewer sees it is in progress, resolves or dismisses it with a reason, and replies. It can leave its own comment pins and propose exact text replacements the reviewer accepts as a diff. SimpleCommenter does not advertise agent-authored comments or suggested edits, and MarkLayer does not have SimpleCommenter's per-project scoping of what an agent may touch. If you want other picks, see [SimpleCommenter alternatives](/alternatives/simplecommenter), or the [Huddlekit](/vs/huddlekit) and [SureFeedback](/vs/surefeedback) pages for two other widget-based tools.

## Sources

Prices and features come from the vendor's own pages, read on 11 October 2026:

- [SimpleCommenter homepage](https://simplecommenter.com/)
- [SimpleCommenter pricing](https://simplecommenter.com/pricing)
- [SimpleCommenter integrations](https://simplecommenter.com/integrations)
- [SimpleCommenter AI agent and MCP](https://simplecommenter.com/integrations/ai-agent)
- [SimpleCommenter Jira integration](https://simplecommenter.com/integrations/jira)
