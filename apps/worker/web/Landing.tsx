import { Toasts } from '@ext/components/Toasts';
import { cn, sessionResponseSchema } from '@marklayer/types';
import { useSignal } from '@preact/signals';
import { ArrowUpRight, Check } from 'lucide-preact';
import type { ComponentChildren } from 'preact';
import { useEffect } from 'preact/hooks';
import { Logo } from './shared';
import { navigateTo, withScheme } from './signals';

const CMS_URL = 'https://cms.smbteam.com';
const UPSTREAM_URL = 'https://github.com/thevrus/MarkLayer';

const PILL_CLS =
  'inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ml-green px-6 text-ui-lg font-semibold text-ml-navy no-underline transition-colors hover:bg-ml-btn-hover';
const NAV_LINK_CLS = 'rounded-full px-3 py-2 text-ui-lg font-medium text-white/85 no-underline hover:text-white';

const STEPS = [
  {
    title: 'Open your site',
    body: "Paste your new site's address, or open the link your SMB Team project manager sent you.",
  },
  {
    title: 'Click and comment',
    body: "Click anything that needs a change and tell us what you'd like instead. Nothing to install, no account.",
  },
  {
    title: 'Watch it get done',
    body: 'Every note lands on your punch list. Green means open; it turns navy once we have checked it off.',
  },
];

const SAMPLE_ITEMS = [
  { text: 'Logo looks fuzzy on my phone', done: false },
  { text: 'Use our new attorney headshots here', done: false },
  { text: 'Phone should be our intake line', done: false },
  { text: 'Footer hours say Sunday', done: true },
];

function focusStart() {
  const input = document.getElementById('start');
  if (!(input instanceof HTMLInputElement)) return;
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  input.focus({ preventScroll: true });
}

function StartForm() {
  return (
    <form
      class="mt-9 flex w-full max-w-[480px] flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        const el = e.currentTarget.elements.namedItem('url');
        if (!(el instanceof HTMLInputElement)) return;
        const input = el.value.trim();
        if (input) navigateTo({ url: withScheme(input), source: 'hero_form' });
      }}
    >
      {/* 16px `text-base`, not the ui step: iOS Safari zooms a focused field under 16px. */}
      <input
        id="start"
        name="url"
        type="text"
        inputMode="url"
        autocomplete="url"
        aria-label="Website address"
        placeholder="Paste your site's address"
        class="h-12 w-full min-w-0 rounded-full border-none bg-white sm:flex-1 px-5 text-base text-ml-navy outline-none placeholder:text-ml-navy/55 focus-visible:ring-2 focus-visible:ring-ml-green"
      />
      <button type="submit" class={cn(PILL_CLS, 'cursor-pointer border-none')}>
        Start a list
      </button>
    </form>
  );
}

/** In place of the form for anyone not signed in on the team: a client only ever needs the link they were sent. */
function TeamOnly() {
  return (
    <div class="mt-9 flex max-w-[480px] flex-col items-start gap-5 rounded-2xl bg-white/10 p-6">
      <p class="m-0 text-body leading-prose text-white/85">
        <strong class="font-semibold text-white">Got a link from SMB Team?</strong> Just open it. There's no account to
        make. Starting a new list is for the SMB Team.
      </p>
      <a href="/app" class={PILL_CLS}>
        Team sign in
      </a>
    </div>
  );
}

/** A pin as the product draws one: green and numbered while open, navy once done. */
function SamplePin({ n, done, class: className }: { n: number; done?: boolean; class: string }) {
  return (
    <span
      class={cn(
        'absolute grid size-7 place-items-center rounded-full text-meta font-semibold ring-2 ring-white',
        done ? 'bg-ml-navy text-white' : 'bg-ml-green text-ml-navy',
        className,
      )}
    >
      {n}
    </span>
  );
}

/** The product in one picture: a client's page with pins on it, and the list they feed. */
function HeroPicture() {
  return (
    <div class="hidden items-start gap-4 lg:flex" aria-hidden="true">
      <div class="relative min-w-0 flex-1 overflow-hidden rounded-xl bg-white">
        <div class="flex items-center gap-1.5 bg-ml-bg-device px-3.5 py-2.5">
          <span class="size-2 rounded-full bg-ml-navy/25" />
          <span class="size-2 rounded-full bg-ml-navy/25" />
          <span class="size-2 rounded-full bg-ml-navy/25" />
          <span class="ml-3 truncate text-meta text-ml-navy/60">clientfirm.smbagency.website</span>
        </div>
        <div class="relative space-y-4 p-5 pb-16">
          <div class="h-3 w-2/5 rounded-sm bg-ml-navy/85" />
          <div class="h-28 rounded-md bg-ml-bg-device" />
          <div class="h-2 w-3/4 rounded-full bg-ml-bg-viewer" />
          <div class="h-2 w-3/5 rounded-full bg-ml-bg-viewer" />
          <div class="flex gap-3">
            <div class="h-7 w-2/5 rounded-sm bg-ml-blue" />
            <div class="h-7 w-1/3 rounded-sm border border-ml-navy/30" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="h-14 rounded-md bg-ml-bg-viewer" />
            <div class="h-14 rounded-md bg-ml-bg-viewer" />
            <div class="h-14 rounded-md bg-ml-bg-viewer" />
          </div>
          <SamplePin n={1} class="top-3 left-[45%]" />
          <SamplePin n={2} class="top-[5.5rem] right-[18%]" />
          <SamplePin n={3} class="top-[11.5rem] left-[38%]" />
          <SamplePin n={4} done class="bottom-4 left-5" />
        </div>
      </div>
      <div class="w-52 shrink-0">
        <p class="m-0 mb-3 text-ui-lg font-semibold text-white">Punch list · {SAMPLE_ITEMS.length}</p>
        <ul class="m-0 flex list-none flex-col gap-2 p-0">
          {SAMPLE_ITEMS.map(({ text, done }) => (
            <li
              key={text}
              class={cn(
                'flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-ui leading-snug',
                done ? 'bg-white/10 text-white/70 line-through' : 'bg-white text-ml-navy',
              )}
            >
              <span
                class={cn(
                  'mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm',
                  done ? 'bg-ml-green text-ml-navy' : 'border border-ml-navy/30',
                )}
              >
                {done && <Check size={11} strokeWidth={3} />}
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: ComponentChildren }) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      class="inline-flex min-h-9 items-center gap-1 text-ml-navy/70 no-underline hover:text-ml-navy"
    >
      {children}
      {external && <ArrowUpRight size={13} aria-hidden="true" />}
    </a>
  );
}

/** The front door: start a list from a site's address, and a short account of what happens next. */
export function Landing() {
  // Null until the session answers; the form shows meanwhile, since the server refuses a create either way.
  const canStart = useSignal<boolean | null>(null);
  const signedIn = useSignal(false);
  useEffect(() => {
    fetch('/auth/me')
      .then((res) => res.json())
      .then((json) => {
        const parsed = sessionResponseSchema.safeParse(json);
        canStart.value = parsed.success ? (parsed.data.canStartBoards ?? true) : null;
        signedIn.value = parsed.success && parsed.data.user !== null;
      })
      .catch(() => undefined);
  }, []);
  const teamOnly = canStart.value === false;

  return (
    <div class="ml-force-light min-h-screen bg-ml-bg font-ui text-ml-navy">
      <div class="bg-ml-navy text-white">
        <header class="mx-auto flex h-20 w-full max-w-page items-center justify-between gap-4 border-b border-white/10 px-6 sm:px-10">
          <a href="/" class="flex items-center gap-3 text-white no-underline">
            <Logo size={32} tone="light" />
            <span class="text-title font-bold">Punch List</span>
            <span class="hidden rounded-full border border-white/30 px-2.5 py-0.5 text-meta font-medium sm:inline">
              SMB Team
            </span>
          </a>
          <nav class="flex items-center gap-1 sm:gap-2">
            <a href="#how" class={cn(NAV_LINK_CLS, 'hidden md:inline-flex')}>
              How it works
            </a>
            <a href={CMS_URL} target="_blank" rel="noopener" class={cn(NAV_LINK_CLS, 'hidden md:inline-flex')}>
              smbCMS
            </a>
            <a href="/app" class={NAV_LINK_CLS}>
              {signedIn.value ? 'My lists' : 'Team sign in'}
            </a>
            {!teamOnly && (
              <button
                type="button"
                onClick={focusStart}
                class={cn(PILL_CLS, 'ml-2 hidden h-11 cursor-pointer border-none sm:inline-flex')}
              >
                Start a list
              </button>
            )}
          </nav>
        </header>

        <main>
          <section class="mx-auto grid w-full max-w-page items-center gap-14 px-6 pt-16 pb-20 sm:px-10 sm:pt-20 sm:pb-28 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <p class="m-0 flex items-center gap-2 text-meta font-semibold tracking-eyebrow text-white/85 uppercase">
                <span class="size-2 rounded-full bg-ml-green" aria-hidden="true" />
                Website review for your firm
              </p>
              <h1 class="mt-6 mb-0 text-hero font-bold">
                Mark it up.
                <span class="block text-ml-green">We'll knock it out.</span>
              </h1>
              <p class="mt-7 mb-0 max-w-[30em] text-lede leading-prose text-white/85">
                Click anywhere on your new site and tell us what needs fixing. Every note lands on your team's list, and
                you watch each one get checked off.
              </p>
              {teamOnly ? <TeamOnly /> : <StartForm />}
              <p class="mt-5 mb-0 flex flex-wrap gap-x-5 gap-y-1 text-ui text-white/70">
                <span>No account</span>
                <span>Nothing to install</span>
                <span>Included with your SMB Team site</span>
              </p>
            </div>
            <HeroPicture />
          </section>
        </main>
      </div>

      <section id="how" class="mx-auto w-full max-w-page scroll-mt-6 px-6 py-20 sm:px-10 sm:py-28">
        <p class="m-0 text-meta font-semibold tracking-eyebrow text-ml-blue uppercase">How it works</p>
        <h2 class="mt-3 mb-0 text-statement font-bold">Three steps, and the last one is ours.</h2>
        <ol class="m-0 mt-12 grid list-none gap-5 p-0 md:grid-cols-3">
          {STEPS.map(({ title, body }, i) => (
            <li key={title} class="rounded-2xl bg-white p-7 sm:p-8">
              <span class="grid size-9 place-items-center rounded-full bg-ml-green text-ui-lg font-bold text-ml-navy">
                {i + 1}
              </span>
              <h3 class="mt-5 mb-0 text-heading font-semibold">{title}</h3>
              <p class="mt-2 mb-0 text-body leading-prose text-ml-navy/75">{body}</p>
            </li>
          ))}
        </ol>
        <div class="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          {teamOnly ? (
            <a href="/app" class={PILL_CLS}>
              Team sign in
            </a>
          ) : (
            <button type="button" onClick={focusStart} class={cn(PILL_CLS, 'cursor-pointer border-none')}>
              Start a list
            </button>
          )}
          <a href="/help" class="text-ui-lg font-medium text-ml-navy underline underline-offset-4">
            Read the help page
          </a>
        </div>
      </section>

      <footer class="border-t border-ml-rule">
        <div class="mx-auto flex w-full max-w-page flex-col gap-6 px-6 py-10 text-ui sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <div class="flex items-center gap-2.5">
            <Logo size={22} />
            <span class="font-semibold">Punch List</span>
            <span class="text-ml-navy/60">by SMB Team</span>
          </div>
          <nav class="flex flex-wrap gap-x-5">
            <FooterLink href="/help">Help</FooterLink>
            <FooterLink href="/mcp">For AI agents</FooterLink>
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href={CMS_URL}>smbCMS</FooterLink>
          </nav>
        </div>
        <p class="mx-auto m-0 w-full max-w-page px-6 pb-10 text-fine text-ml-navy/60 sm:px-10">
          &copy; {new Date().getFullYear()} SMB Team. Built on{' '}
          <a
            href={UPSTREAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            class="text-ml-navy/70 underline underline-offset-2"
          >
            MarkLayer
          </a>
          , licensed under Apache-2.0.
        </p>
      </footer>
      <Toasts />
    </div>
  );
}
