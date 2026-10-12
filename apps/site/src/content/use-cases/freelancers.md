---
order: 12
title: "Website Feedback Tool for Freelancers: Free, One Link"
description: "Send your client one link instead of an email thread. They comment on the live page in any browser, nothing to install. Free, no account, no per-project fee."
h1: "MarkLayer for Freelance Web Designers"
nav: "Freelancers"
audience: "freelance web designers and developers who review work with one client at a time"
bottomLine: "For a freelancer, MarkLayer is the review tool that costs nothing and asks nothing of the client. You paste the staging URL, send one link, and the client comments on the real page from their own browser. Neither of you needs an account, the client installs nothing, and there is no monthly fee that only makes sense once you have a team. It also looks like a process, which is the point."
problem: "Solo work means every revision round is yours to run. The client sends a reply-all with four screenshots and a line that says the spacing feels off, you spend twenty minutes working out which page they were on, and the next message says the first screenshot was from their phone. The feedback platforms built for this charge a monthly fee for a workspace you would use twice a month, and most of them want the client to sign up before they can type a word."
published: 2026-10-11
modified: 2026-10-11
why:
  - "Free, with no plan to outgrow. A tool that costs nothing per project is the only kind that makes sense when you bill per project."
  - "The client gets one link and comments on the live page in whatever browser they already use. They need no account, no download and no tour."
  - "Each comment lands on the element it is about, with the page URL attached, so the thread never opens with \"which button?\""
  - "A share link reads as a process. Sending a review page instead of asking for screenshots is a small thing that makes a solo operation look like a studio."
  - "Replies thread under the comment they answer, so the revision round stays on the page instead of spreading across email, iMessage and a shared doc."
  - "Set priority and status on each thread. The client sees what is in progress and what is done without a status email from you."
  - "Live cursors and voice when you want to walk the client through a page together on a call, without screen-sharing."
steps:
  - name: "Paste the URL"
    text: "Go to marklayer.app and paste the staging or live URL. The page loads inside the viewer with the annotation toolbar on top."
  - name: "Mark what changed"
    text: "Pin a note on each section you want the client to look at, or leave it blank and let them react cold. Either way takes a minute."
  - name: "Send one link"
    text: "Click Share and send the link by email or message. That is the whole onboarding."
  - name: "Client comments on the page"
    text: "They open the link, click the spot they mean, and type. Replies thread under each pin, and you see them arrive in real time."
  - name: "Work the list"
    text: "Mark each thread in progress and then resolved as you ship fixes. The client approves the ones they are happy with, and the round ends on the page where it started."
faq:
  - q: "Is it really free, or free until I need something?"
    a: "There is one version and it is free. No trial, no seat count, no feature that unlocks on a paid tier. It is open source under Apache 2.0, so the price cannot change out from under a project you already shipped on it."
  - q: "What does my client have to install?"
    a: "Nothing. They open the share link in their browser and the comment tool is already loaded. On a phone they get a simplified bar with the comment tool and page navigation. The free Chrome extension is for you, and only when the site sits behind a login that the web app cannot reach."
  - q: "Does this work on a password-protected staging site?"
    a: "Not through the web app link on its own, because the page is fetched by MarkLayer's server without your cookies. Install the free Chrome extension, open the staging site in your signed-in tab, and annotate there. A reviewer on a protected site joins the room the same way from their own browser. [Staging feedback without an extension](/for/staging-feedback-no-extension) explains both paths."
  - q: "Can I use it on the client's live site after launch?"
    a: "Yes. The web app loads any URL the public internet can reach, so a post-launch tweak round works the same way as a staging review. The site itself is not modified. The annotations live in MarkLayer and are drawn on top."
  - q: "What happens to the comments when the project is done?"
    a: "They stay for 90 days after the room was last opened, and any visit resets that clock. If you want a record for the project file, fetch the room's JSON from marklayer.app/api/{id} before it goes quiet."
  - q: "How does this compare to Markup.io or Ruttl?"
    a: "Both are good. Both put the useful parts on a monthly plan and organise around a project workspace. MarkLayer has no workspace to join and no plan to pick. If you want project folders and version history, pay for one of those. If you want the client commenting within a minute of receiving a link, this is the shorter path. See [MarkLayer vs Markup.io](/vs/markup-io) for the detail."
---

A freelancer's review round has two people in it and no one to run the process, so the tool has to be the process. With MarkLayer, you paste a URL, send a link and the client comments on the page. There is no account to set up and nothing for them to learn. It adds nothing to the invoice. When the round is over, every comment is still pinned to the thing it was about, which is more than an email thread can say.

If you grow into a team with several clients at once, the [agencies](/for/agencies) page covers how the same tool works when there are ten projects open instead of one.
