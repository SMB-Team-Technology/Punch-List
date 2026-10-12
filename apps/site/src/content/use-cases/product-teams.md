---
order: 13
title: "Website Feedback Tool for Product Teams: Review Staging Live"
description: "Review a staging build on the page itself. Comments anchor to the element with its selector, carry priority and status, and hand off to a coding agent over MCP."
h1: "MarkLayer for Product Teams"
nav: "Product teams"
audience: "product managers, designers and engineers reviewing staging, preview and production builds together"
bottomLine: "For a product team, MarkLayer turns a review of a staging build into a list of element-anchored threads the engineer can act on. Each comment carries the CSS selector and the text of the element it points at, a priority and a status, and the same thread can be worked by an AI coding agent over MCP with no server to install. It is free and nobody on the team signs up. The hand-off to Linear, GitHub or Jira is one click out."
problem: "Design QA on a preview build is a Slack thread of cropped screenshots. The designer posts a PNG with a red box, the PM asks which breakpoint, the engineer asks which component, and by the time it reaches a ticket the build has been redeployed and the screenshot shows something that no longer exists. The feedback tools built for this want a per-seat licence for everyone who might comment, which on a product team is everyone."
published: 2026-10-11
modified: 2026-10-11
why:
  - "Review the actual build. Paste the preview URL into marklayer.app, or open it in Chrome with the extension when it sits behind SSO."
  - "Comments anchor to the element itself. Each one carries the element's CSS selector, its tag and its text, and re-attaches when the page reflows or the selector changes under a redesign."
  - "The inspector tool captures an element's selector and rect for a precise hand-off when a comment is not enough."
  - "Every thread has a priority (low to urgent), a status (open, in progress, resolved, approved, dismissed) and an assignee. The person who asked for the change is the one who marks it approved."
  - "Live cursors and voice in the same room, so a design review call happens on the page instead of over a screen-share."
  - "Every share link is also an MCP server at /s/{id}/mcp. Point Claude Code, Cursor or any MCP client at it and the agent reads the threads, acknowledges them, makes the change and resolves them, with its status visible to the people in the room."
  - "File a thread to Linear, GitHub, Jira, Trello or Notion, or post new comments to Slack, Teams or Discord. One-way, out of MarkLayer. Nothing syncs back in."
  - "Free, with no seats. The whole team and the stakeholders they invite cost the same as one person."
steps:
  - name: "Open the preview build"
    text: "Paste the preview or staging URL into marklayer.app. For a build behind SSO, open it in Chrome and use the free extension in your signed-in tab instead."
  - name: "Leave element-anchored comments"
    text: "Click the component you mean and type. The comment records the element's selector and text, so it still points at the right thing after the next deploy."
  - name: "Share one link with the team"
    text: "Click Share and drop the link in the channel. Everyone opens it in their browser and comments alongside you, with no account on anyone's side."
  - name: "Triage on the page"
    text: "Set priority and an assignee on each thread. Mark the ones that are not going to happen as dismissed so the list only shows real work."
  - name: "Hand off to a person or an agent"
    text: "File a thread to Linear, GitHub or Jira from the thread itself, or connect a coding agent to the room's MCP endpoint and let it work the open threads while the team watches each one move to resolved."
  - name: "Close the loop"
    text: "The engineer or the agent marks a thread resolved. The designer or PM who raised it marks it approved, and the review ends on the build it was about."
faq:
  - q: "Does anyone on the team need an account?"
    a: "No. The share link is the access mechanism, and everyone who opens it can comment, reply and mark up the page in their browser. Optional magic-link accounts exist for a dashboard of your own rooms and for view-only links, but you can skip them."
  - q: "What exactly does a comment carry for the engineer?"
    a: "The page URL, the comment text and thread, and a target block with the element's CSS selector, its tag name, its content as markdown, its rectangle at capture time and a short text fingerprint used as a fallback when the selector no longer matches. The inspector tool captures the same handle for an element on its own, without a comment. Reading the thread from the API or over MCP returns this block as data."
  - q: "How does the AI agent hand-off work?"
    a: "Every room answers MCP over Streamable HTTP at marklayer.app/s/{id}/mcp, so adding it to Claude Code is one command and nothing is installed. For clients that only run local servers, the marklayer-mcp package on npm wraps the same tools over stdio. The agent lists and watches annotations, acknowledges one, makes the change, replies or resolves, and can propose an exact text edit for a selection. People in the room see the agent's name on what it did."
  - q: "Do the Linear, GitHub and Jira integrations sync both ways?"
    a: "No. They send out of MarkLayer only. Filing a thread creates one issue, and the Slack, Teams, Discord and webhook destinations receive new comments as they arrive. Closing the issue in the tracker does not change the thread here, and resolving the thread here does not close the issue. The tracker token is supplied when you file and is not stored with the room."
  - q: "Does it capture console errors, network requests or browser details?"
    a: "It does not capture network requests or browser and OS metadata. If a bug report needs those, BugHerd or Jam is the better fit for that part of the job. See the [BugHerd comparison](/vs/bugherd) for where each tool sits."
  - q: "Does it work on a preview build behind SSO?"
    a: "The web app fetches the page from MarkLayer's server with no cookies, so an SSO wall shows the login page. Use the free Chrome extension in your own signed-in tab, and have each reviewer join the room from theirs. [Staging feedback without an extension](/for/staging-feedback-no-extension) covers both paths."
  - q: "How long do review threads stay around?"
    a: "90 days after the room was last opened, and any visit resets that. For a record past that, fetch the room's JSON from marklayer.app/api/{id} or file the threads that matter to your tracker."
---

A product team's review has three people who each need something different from the same comment: the designer needs it on the right pixel, the PM needs a status, and the engineer needs a selector. MarkLayer puts all three on one thread anchored to the element on the live build. The thread can be worked by the engineer, filed to the tracker, or handed to a coding agent over MCP, and whichever path it takes, the people in the room watch it move from open to resolved to approved on the page.

Teams reviewing a local dev server with an agent in the loop should read [localhost and AI agents](/for/localhost-ai-agents), which covers the extension side of that flow.
