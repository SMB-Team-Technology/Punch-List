import { HOW_IT_WORKS_PATH } from '@ext/lib/share';
import { Eye, FileDown, Files, type LucideIcon, MonitorPlay, Ruler, Send, SquareKanban, Video } from 'lucide-preact';

/** What an agent does once it is in the room, one claim per cell. */
export const AGENT_MOMENTS: { title: string; desc: string }[] = [
  {
    title: 'It knows what you clicked.',
    desc: 'The comment arrives with the exact piece of the page it was left on, so nobody has to describe it twice.',
  },
  {
    title: 'You watch it work.',
    desc: 'Seen, replied, done. Every step shows up on the page while the thread is still in front of you.',
  },
  {
    title: 'Wording fixes come back exact.',
    desc: 'A typo or a better sentence comes back as the replacement itself.',
  },
];

/** The agents whose marks the product already draws when they join a room. */
export const AGENT_IDS = ['claude', 'cursor', 'copilot', 'windsurf', 'cline', 'zed', 'gemini'] as const;

/**
 * The rest of the product, one line each. Eight, so the grid closes on a full
 * row at two columns and at four.
 */
export const FEATURES: { title: string; desc: string; icon: LucideIcon }[] = [
  { title: 'Talk it through.', desc: 'Voice and video calls, right inside the review.', icon: Video },
  {
    title: 'Walk people through it.',
    desc: 'Bring everyone to the part you are looking at, or follow along with someone else.',
    icon: MonitorPlay,
  },
  {
    title: 'Track what is done.',
    desc: 'Mark a comment open, in progress or done, give it a priority, and see them all on one board.',
    icon: SquareKanban,
  },
  {
    title: 'Measure anything.',
    desc: 'Check sizes and spacing in pixels, and pin ruler lines to the page.',
    icon: Ruler,
  },
  { title: 'Review a whole site.', desc: 'Up to 50 pages on one link, each in its own tab.', icon: Files },
  {
    title: 'Send it to your tools.',
    desc: 'New comments post to Slack, Teams or Discord. One comment becomes a Linear, GitHub, Jira or Trello task.',
    icon: Send,
  },
  {
    title: 'Export the whole review.',
    desc: 'Every comment and reply in one document you can copy or download.',
    icon: FileDown,
  },
  {
    title: 'Lock a link.',
    desc: 'Sign in with your email, if you want to, and make a link read-only, set an end date or see all your links.',
    icon: Eye,
  },
];

/**
 * The nav's links. The page shipped with a logo, two icon links and no
 * navigation at all, while the footer carried twenty — so the only way into the
 * comparison and use-case pages was to scroll past everything first.
 */
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'How it works', href: HOW_IT_WORKS_PATH },
  { label: 'Compare', href: '/compare' },
  { label: 'Use cases', href: '/use-cases' },
  { label: 'Pricing', href: '/pricing' },
];

/** The four tools the alternatives heading names, each linked to its head-to-head page. */
export const COMPARISONS: { name: string; href: string }[] = [
  { name: 'BugHerd', href: '/vs/bugherd' },
  { name: 'Marker.io', href: '/vs/marker-io' },
  { name: 'Pastel', href: '/vs/pastel' },
  { name: 'Markup.io', href: '/vs/markup-io' },
];
/** The heading names exactly the tools the section links. */
export const COMPARISON_NAMES = new Intl.ListFormat('en', { type: 'conjunction' }).format(
  COMPARISONS.map((c) => c.name),
);

export const FAQ: { q: string; a: string }[] = [
  {
    q: 'Does my client need to install anything?',
    a: 'No. They open the link, click on the page and type. They do not install anything or create an account.',
  },
  { q: 'Is it really free?', a: 'Yes. No account, no paywall, no trial that runs out.' },
  {
    q: 'Does my client need to know anything technical?',
    a: 'No. If they can use a web browser, they can leave a comment. The technical details come attached on their own.',
  },
  {
    q: 'Does it work on any website?',
    a: 'Yes. Production, staging, internal tools, localhost, third-party pages.',
  },
  {
    q: 'Does it work on localhost?',
    a: 'Yes, with the Chrome extension. It draws in your browser, so your dev server never has to be reachable from the internet. Share links do need a public URL, so point collaborators at staging or a tunnel.',
  },
  {
    q: 'Can multiple people annotate at the same time?',
    a: 'Yes. Everyone sees each other’s cursors and marks as they happen, and you can talk over voice or video in the same room.',
  },
  {
    q: 'Can I keep a link private?',
    a: 'Links are unguessable and unlisted. If you sign in with an email link (optional), you can make one view-only or set when it expires.',
  },
];

/**
 * The one seeded annotation on the board.
 *
 * A fixed id rather than a nanoid, so a re-mount can never stack a second copy
 * of it. The landing never calls `restoreDraft`, so every load starts from an
 * empty op list and this is the only thing on the board until a visitor draws.
 *
 * It is a real CommentOp on the real op stream: the pin it renders is
 * WebCommentPin, clicking it opens the actual thread, and replying, resolving
 * or deleting it all work exactly as they do on a shared page. The page claims
 * to be a live board one line above the toolbar; this is the claim being true
 * rather than asserted.
 */
export const HERO_PIN_ID = 'ml-hero-pin';

export const CTA_CLS =
  'lp-cta inline-flex items-center gap-2 h-12 px-7 rounded-full text-white text-body no-underline whitespace-nowrap transition-colors';
