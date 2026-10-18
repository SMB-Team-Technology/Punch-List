/**
 * The reviewer help, as data. `/help` renders it as a page and `/help.md` as plain
 * Markdown, so the two cannot drift. Every UI label quoted here is the one the
 * viewer actually shows; check apps/worker/web before renaming one.
 */

export interface HelpSection {
  heading: string;
  /** Paragraphs before the steps. */
  lead?: string[];
  /** A numbered sequence. */
  steps?: string[];
  /** Paragraphs after the steps. */
  after?: string[];
}

export const HELP_H1 = 'How to leave feedback on your new website';

export const HELP_INTRO =
  'SMB Team sends you a link to your new website. Open it, click anywhere on the page and leave a note. Every note lands on the team’s punch list, and you watch each one get checked off.';

export const HELP_COMMENT_STEPS = [
  'Pick the Comment tool in the toolbar, or press C.',
  'Click the spot on the page your note is about.',
  'Type what needs changing.',
  'Press Enter or click Post. Shift+Enter starts a new line.',
];

export const HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'Before you start',
    lead: [
      'There is nothing to install and no account to create. The link opens in any modern browser, on a computer or a phone.',
      'You start with a random name, like “Brave Otter”. To use your own, click your name in the top bar and type it under “Your name”. Everyone on the link sees it on your comments, and renaming updates the comments you have already left.',
    ],
  },
  {
    heading: 'Leave a comment',
    steps: HELP_COMMENT_STEPS,
    after: [
      'A pin appears where you clicked, and everyone on the link sees it straight away. Use the attach button in the comment box to add a screenshot.',
    ],
  },
  {
    heading: 'Reply to a comment',
    lead: [
      'On a computer, hover over a pin to open its thread, then click Reply. On a phone, tap the pin and the thread opens in the comments list. Press Enter to send.',
    ],
  },
  {
    heading: 'See what is done',
    lead: [
      'Every comment has a status, and the pin shows it. An open comment has no badge. A spinning amber icon means the team is working on it. A green check means it is resolved, and a double check means it has been approved.',
      'To see every comment in one list, click the speech-bubble button in the top bar, or tap Threads on a phone. The “Filter by status” menu narrows the list to just the open ones. Resolved comments are struck through.',
      'If something marked resolved still looks wrong, reply on the thread and say so.',
    ],
  },
  {
    heading: 'Desktop, tablet and phone',
    lead: [
      'You can review on your phone: the bar along the bottom has Move, Comment and Threads.',
      'On a computer, the Viewport switch in the top bar shows the page at desktop, tablet or mobile width, and All devices shows the three side by side. Comments left in the tablet or mobile view are labelled, so the team knows which layout you meant.',
    ],
  },
  {
    heading: 'Questions',
    lead: ['Contact your SMB Team project manager. They can help with anything on this page, or on your site.'],
  },
];
