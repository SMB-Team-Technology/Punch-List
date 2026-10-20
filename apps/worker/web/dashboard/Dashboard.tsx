import { Dialog } from '@base-ui/react/dialog';
import { submitBtn } from '@ext/lib/buttons';
import { geist } from '@ext/lib/geist';
import { portalContainer } from '@ext/lib/portal';
import { shareUrl } from '@ext/lib/share';
import { useCopyToClipboard } from '@ext/lib/useCopy';
import { cn, DAY_SECONDS, deletionDeadline, type OwnedLink } from '@marklayer/types';
import { type Signal, useSignal } from '@preact/signals';
import { ChevronRight, Globe, LayoutGrid, Link2, List, Search, Settings2, Trash2 } from 'lucide-preact';
import { Link } from 'wouter-preact';
import { CopyControl } from '../shared';
import { APP_MEASURE } from './AppBar';
import {
  DashTabs,
  FolderActions,
  FolderDialog,
  FolderIndex,
  filterPath,
  inFilter,
  MoveMenu,
  matchesQuery,
  NewFolderButton,
} from './Folders';
import { LinkSettings } from './LinkSettings';
import {
  type FolderFilter,
  folders,
  type ListLayout,
  links,
  linksLoading,
  listLayout,
  releaseLink,
  searchQuery,
  setListLayout,
  user,
} from './session';

/** Where the expiry stops being background information and starts being news. */
const SOON_DAYS = 7;
/** And where it stops being news and becomes the last thing you can do about it. */
const LAST_CALL_DAYS = 1;

/**
 * Emphasis by tone, not by colour. A saturated red on every link inside a week
 * makes the loudest thing on the page the one that is still fine; red is held
 * back for the day the link actually goes.
 */
function expiryTone(days: number | null): string {
  if (days === null) return '';
  if (days <= LAST_CALL_DAYS) return 'font-medium text-(--ds-red-700)';
  if (days <= SOON_DAYS) return 'font-medium text-(--ds-gray-1000)';
  return '';
}

/**
 * Days until the retention cron takes it, or null when nothing is going to. Every
 * row here is claimed by definition — `listAnnotations` selects on `owner_id` —
 * so `owned` is the constant that makes the idle window not apply.
 */
function daysLeft(link: OwnedLink): number | null {
  const deadline = deletionDeadline({ ...link, owned: true });
  return deadline === null ? null : Math.max(0, Math.ceil((deadline - Date.now() / 1000) / DAY_SECONDS));
}

/** The end of the row's meta line: a countdown, or that there is no countdown. */
function expiryText(days: number | null): string {
  if (days === null) return 'No expiry';
  if (days === 0) return 'Expires today';
  return `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
}

function whenText(seconds: number): string {
  const days = Math.floor((Date.now() / 1000 - seconds) / DAY_SECONDS);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return new Date(seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function hostOf(url: string | null): string {
  if (!url) return 'Untitled';
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** The rest of the address. Two links into the same site are otherwise one row twice. */
function pathOf(url: string | null): string {
  if (!url) return '';
  try {
    const { pathname, search } = new URL(url);
    const rest = `${pathname}${search}`;
    return rest === '/' ? '' : rest;
  } catch {
    return '';
  }
}

/** The card the whole page is built from — one hairline, one radius, no shadow. */
const PANEL = 'rounded-xl border border-(--ds-gray-alpha-400) bg-(--ds-background-100)';

/**
 * `geist.actionBtn` pulls 6px off both sides so a lone action lines up with the
 * content above it. In a right-aligned pair that eats the gap between the two
 * labels, so the inner margins are cancelled and only the outer edge keeps one.
 */
const CONFIRM_BTN = 'mx-0 text-(--ds-red-700) hover:bg-(--ds-gray-alpha-100)';
const CONFIRM_LAST = 'mx-0 -mr-1.5';

/** 44px on touch, back to the 28px row control from `sm` up. Mirrors `shared.tsx`. */
const ROW_CTL = 'size-11 sm:size-7';

/** Copy, and say so: the flash is the confirmation, and a failed write toasts instead. */
function CopyButton({ link }: { link: OwnedLink }) {
  const { copied, copy } = useCopyToClipboard({ resetMs: 1600 });
  // A site is shared as the site, so the client gets every page from the one link.
  const target = link.site
    ? { kind: 'project' as const, id: link.site.projectId }
    : { kind: 'page' as const, id: link.id };
  return (
    <CopyControl
      copied={copied.value}
      onClick={() => copy(shareUrl({ origin: location.origin, ...target, ref: 'dash' }))}
      size={14}
      strokeWidth={1.5}
      class={cn(geist.ctlSm, ROW_CTL)}
    />
  );
}

type RowMode = 'idle' | 'confirming' | 'settings';

function Sep() {
  return (
    <span class="px-1.5" aria-hidden="true">
      ·
    </span>
  );
}

/** Pages, open threads, last opened, expiry: the line under every list's name, in a row or on a card. */
function LinkMeta({ link, class: className }: { link: OwnedLink; class?: string }) {
  const left = daysLeft(link);
  return (
    // Flex-wrap so a narrow card or phone row breaks between the parts, never inside one.
    <p class={cn('text-meta flex flex-wrap items-baseline text-(--ds-gray-900)', className)}>
      {link.site && (
        <>
          <span class="tabular-nums whitespace-nowrap">
            {link.site.pageCount} {link.site.pageCount === 1 ? 'page' : 'pages'}
          </span>
          <Sep />
          <span
            class={cn('tabular-nums whitespace-nowrap', link.site.openCount > 0 && 'font-medium text-(--ds-gray-1000)')}
          >
            {link.site.openCount > 0 && (
              <span class="mr-1 inline-block size-2 rounded-full bg-ml-green align-middle" aria-hidden="true" />
            )}
            {link.site.openCount === 0 ? 'All done' : `${link.site.openCount} open`}
          </span>
          <Sep />
        </>
      )}
      <span class="tabular-nums whitespace-nowrap">Opened {whenText(link.lastAccessedAt)}</span>
      <Sep />
      <span class={cn('tabular-nums whitespace-nowrap', expiryTone(left))}>{expiryText(left)}</span>
      {link.access === 'view' && (
        <>
          <Sep />
          <span class="whitespace-nowrap">View only</span>
        </>
      )}
    </p>
  );
}

/** Copy, move, settings, remove — or, once remove is pressed, the confirmation that replaces them. */
function LinkActions({ link, mode, class: className }: { link: OwnedLink; mode: Signal<RowMode>; class?: string }) {
  if (mode.value === 'confirming') {
    return (
      <div class={cn('relative flex shrink-0 items-center gap-1', className)}>
        <button type="button" class={cn(geist.actionBtn, CONFIRM_BTN)} onClick={() => void releaseLink(link.id)}>
          Remove
        </button>
        <button
          type="button"
          class={cn(geist.actionBtn, geist.ctlIdle, CONFIRM_LAST)}
          onClick={() => {
            mode.value = 'idle';
          }}
        >
          Cancel
        </button>
      </div>
    );
  }
  return (
    <div class={cn('relative flex shrink-0 items-center gap-1', className)}>
      <CopyButton link={link} />
      <MoveMenu link={link} class={cn(geist.ctlSm, geist.ctlIdle, ROW_CTL)} />
      <button
        type="button"
        aria-label="Link settings"
        aria-expanded={mode.value === 'settings'}
        class={cn(
          geist.ctlSm,
          geist.ctlIdle,
          ROW_CTL,
          mode.value === 'settings' && 'bg-(--ds-gray-alpha-100) text-(--ds-gray-1000)',
        )}
        onClick={() => {
          mode.value = mode.value === 'settings' ? 'idle' : 'settings';
        }}
      >
        <Settings2 size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Remove from your links"
        class={cn(geist.ctlSm, geist.ctlIdle, ROW_CTL, 'hover:text-(--ds-red-700)')}
        onClick={() => {
          mode.value = 'confirming';
        }}
      >
        <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}

function linkHref(link: OwnedLink): string {
  return link.site ? `/p/${link.site.projectId}` : `/s/${link.id}`;
}

/** The searchable text of a list: its address, as the reader would type it. */
function linkFields(link: OwnedLink): string[] {
  return [hostOf(link.url), pathOf(link.url)];
}

function LinkRow({ link }: { link: OwnedLink }) {
  const mode = useSignal<RowMode>('idle');
  // A site row names the site; one page's path would misdescribe it.
  const path = link.site ? '' : pathOf(link.url);
  return (
    <li class="px-4 py-3.5 transition-colors duration-150 hover:bg-(--ds-gray-alpha-100)">
      {/* `group` sits on the title row, not the <li>: hovering a toggle in the
          settings panel below should not underline the link above it. */}
      {/* Wraps: on a phone the actions drop under the title rather than squeezing it to a dozen characters. */}
      <div class="group relative flex flex-wrap items-center gap-x-3 gap-y-2">
        <div class="min-w-0 flex-1 basis-64">
          {/* The stretched pseudo-element makes the whole row the link, which is
              why the actions beside it are positioned: later in the DOM and also
              positioned, so they stack above the overlay without a z-index. */}
          <a
            href={linkHref(link)}
            class="text-ui tracking-ui block truncate font-medium text-(--ds-gray-1000) no-underline after:absolute after:inset-0 group-hover:underline"
          >
            {hostOf(link.url)}
            {path ? <span class="font-normal text-(--ds-gray-900)">{path}</span> : null}
          </a>
          {/* Wraps on a narrow screen rather than truncating: the row already
              gives the title the ellipsis, and an expiry cut to "in 89 da…" is
              the one number on the line worth reading. */}
          <LinkMeta link={link} class="mt-1 sm:block sm:truncate" />
        </div>
        {/* -ml-3 lines the first 44px touch target's icon up with the title when the actions wrap under it. */}
        <LinkActions link={link} mode={mode} class="-ml-3 sm:ml-0" />
      </div>
      {mode.value === 'settings' && (
        <div class="border-t border-(--ds-gray-alpha-400) pt-3">
          <LinkSettings link={link} />
        </div>
      )}
    </li>
  );
}

/**
 * The page as the owner last saw it, captured by their viewer. A list nobody has
 * opened since thumbnails shipped has none, and gets the site's name instead.
 */
function Thumbnail({ link }: { link: OwnedLink }) {
  const missing = useSignal(false);
  if (missing.value) {
    return (
      <div class="flex size-full flex-col items-center justify-center gap-2 px-4 text-center text-(--ds-gray-900)">
        <Globe size={22} strokeWidth={1.5} aria-hidden="true" />
        <span class="text-meta max-w-full truncate">{hostOf(link.url)}</span>
      </div>
    );
  }
  return (
    <img
      src={`/auth/links/${encodeURIComponent(link.id)}/thumbnail`}
      alt=""
      loading="lazy"
      decoding="async"
      class="size-full object-cover object-top"
      onError={() => {
        missing.value = true;
      }}
    />
  );
}

function LinkCard({ link }: { link: OwnedLink }) {
  const mode = useSignal<RowMode>('idle');
  const path = link.site ? '' : pathOf(link.url);
  return (
    <li
      class={cn(
        PANEL,
        'group relative flex flex-col overflow-hidden transition-colors hover:border-(--ds-gray-alpha-600)',
      )}
    >
      <div class="aspect-[16/10] overflow-hidden border-b border-(--ds-gray-alpha-400) bg-(--ds-gray-alpha-100)">
        <Thumbnail link={link} />
      </div>
      <div class="flex flex-1 flex-col gap-1 p-3.5">
        <a
          href={linkHref(link)}
          class="text-ui tracking-ui block truncate font-medium text-(--ds-gray-1000) no-underline after:absolute after:inset-0 group-hover:underline"
        >
          {hostOf(link.url)}
          {path ? <span class="font-normal text-(--ds-gray-900)">{path}</span> : null}
        </a>
        <LinkMeta link={link} class="leading-body" />
        {/* Pinned to the card's foot, so a two-line meta does not stagger the controls across a row of cards. */}
        <div class="mt-auto flex justify-end pt-2">
          <LinkActions link={link} mode={mode} />
        </div>
      </div>
      <SettingsDialog link={link} mode={mode} />
    </li>
  );
}

/** A card has no room to unfold the settings under itself, so they open over the page instead. */
function SettingsDialog({ link, mode }: { link: OwnedLink; mode: Signal<RowMode> }) {
  return (
    <Dialog.Root
      open={mode.value === 'settings'}
      onOpenChange={(open: boolean) => {
        if (!open) mode.value = 'idle';
      }}
    >
      <Dialog.Portal container={portalContainer.value ?? undefined}>
        <Dialog.Backdrop className="fixed inset-0 z-2147483647 bg-black/50" />
        <Dialog.Popup
          className={cn(
            geist.surface,
            'fixed top-1/2 left-1/2 z-2147483647 max-h-[calc(100dvh-32px)] w-[420px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-5',
          )}
        >
          <Dialog.Title className="text-heading tracking-ui m-0 mb-3 truncate font-semibold text-(--ds-gray-1000)">
            {hostOf(link.url)}
          </Dialog.Title>
          <LinkSettings link={link} />
          <div class="mt-4 flex justify-end">
            <Dialog.Close className={cn(geist.actionBtn, geist.ctlIdle, 'mx-0')}>Done</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** One to five columns as the screen widens; a card never gets narrower than its thumbnail reads at. */
const LIST_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';

function LinkCollection({ items, layout }: { items: OwnedLink[]; layout: ListLayout }) {
  if (layout === 'grid') {
    return (
      <ul class={LIST_GRID}>
        {items.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </ul>
    );
  }
  return (
    <ul class={cn(PANEL, 'divide-y divide-(--ds-gray-alpha-400)')}>
      {items.map((link) => (
        <LinkRow key={link.id} link={link} />
      ))}
    </ul>
  );
}

/**
 * Three rows of the shape that is coming. The height is pinned to a real row's
 * 71px so the list does not resize under the reader when the data lands, and
 * the widths vary so three identical bars do not read as a repeating pattern.
 */
const SKELETON_ROWS = [
  ['w-40', 'w-56'],
  ['w-56', 'w-48'],
  ['w-32', 'w-52'],
];

function Skeleton({ layout }: { layout: ListLayout }) {
  if (layout === 'grid') {
    return (
      <ul class={LIST_GRID}>
        {SKELETON_ROWS.map(([title, meta]) => (
          <li key={title} class={cn(PANEL, 'animate-pulse overflow-hidden')}>
            <div class="aspect-[16/10] bg-(--ds-gray-alpha-100)" />
            <div class="flex flex-col gap-2 p-3.5">
              <div class={cn('h-3.5 rounded-sm bg-(--ds-gray-alpha-200)', title)} />
              <div class={cn('h-3 rounded-sm bg-(--ds-gray-alpha-100)', meta)} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul class={cn(PANEL, 'divide-y divide-(--ds-gray-alpha-400)')}>
      {SKELETON_ROWS.map(([title, meta]) => (
        <li key={title} class="flex h-[71px] animate-pulse flex-col justify-center gap-2 px-4">
          <div class={cn('h-3.5 rounded-sm bg-(--ds-gray-alpha-200)', title)} />
          <div class={cn('h-3 rounded-sm bg-(--ds-gray-alpha-100)', meta)} />
        </li>
      ))}
    </ul>
  );
}

function Empty() {
  return (
    <div class={cn(PANEL, 'flex flex-col items-center gap-2 px-6 py-16 text-center')}>
      <Link2 size={24} strokeWidth={1.5} class="text-(--ds-gray-700)" aria-hidden="true" />
      <span class="text-ui font-medium text-(--ds-gray-1000)">No lists yet</span>
      <span class="text-meta leading-body max-w-[28rem] text-balance text-(--ds-gray-900)">
        Every list you start while signed in shows up here. Open one someone else made and choose{' '}
        <span class="text-(--ds-gray-1000)">Save to my links</span> to add it too.
      </span>
      <a href="/" class={cn(submitBtn, 'mt-4 no-underline')}>
        Start a list
      </a>
    </div>
  );
}

function LayoutToggle() {
  const layout = listLayout.value;
  const options: { value: ListLayout; label: string; Icon: typeof List }[] = [
    { value: 'list', label: 'List view', Icon: List },
    { value: 'grid', label: 'Grid view', Icon: LayoutGrid },
  ];
  return (
    <fieldset aria-label="Layout" class={cn(geist.track, 'm-0 min-w-0 border-0')}>
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={layout === value}
          data-pressed={layout === value ? '' : undefined}
          class={geist.segment}
          onClick={() => setListLayout(value)}
        >
          <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ))}
    </fieldset>
  );
}

function SearchField({ placeholder }: { placeholder: string }) {
  return (
    <label class={cn(geist.field, 'flex h-11 min-w-0 flex-1 items-center gap-2 px-3 sm:h-8 sm:max-w-72')}>
      <Search size={14} strokeWidth={1.5} class="shrink-0 text-(--ds-gray-700)" aria-hidden="true" />
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={searchQuery.value}
        onInput={(event) => {
          searchQuery.value = event.currentTarget.value;
        }}
        /* 16px under `sm`, not the text-ui step: iOS Safari zooms into any focused input below it. */
        class={cn(geist.input, 'w-full text-base sm:text-ui')}
      />
    </label>
  );
}

/** The heading: the dashboard's own, or a folder's name under the way back to all of them. */
function Heading({ filter, count }: { filter: FolderFilter; count: number }) {
  const folder = filter.kind === 'folder' ? folders.value.find((f) => f.id === filter.id) : undefined;
  const title = filter.kind === 'folders' ? 'Folders' : folder ? folder.name : 'Your lists';
  const unit = filter.kind === 'folders' ? 'folder' : 'list';
  return (
    <div class="min-w-0">
      {filter.kind === 'folder' && (
        <Link
          href={filterPath({ kind: 'folders' })}
          class="text-meta mb-1 inline-flex items-center gap-1 text-(--ds-gray-900) no-underline hover:text-(--ds-gray-1000)"
        >
          Folders
          <ChevronRight size={12} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      )}
      {/* Baselines, not centres: the count is a subtitle to the title. */}
      <div class="flex min-w-0 items-baseline gap-2.5">
        <h1 class="text-heading tracking-ui truncate font-semibold text-(--ds-gray-1000)">{title}</h1>
        <span class="text-meta shrink-0 tabular-nums text-(--ds-gray-900)">
          {count} {unit}
          {count === 1 ? '' : 's'}
        </span>
        {folder && (
          <FolderActions folder={folder} class={cn(geist.ctlSm, geist.ctlIdle, 'size-11 self-center sm:size-7')} />
        )}
      </div>
    </div>
  );
}

export function Dashboard({ filter }: { filter: FolderFilter }) {
  const account = user.value;
  const all = links.value;
  const layout = listLayout.value;
  const query = searchQuery.value;
  const list = all.filter((link) => inFilter({ link, filter }) && matchesQuery({ query, fields: linkFields(link) }));
  const loading = linksLoading.value && all.length === 0;
  const onFolders = filter.kind === 'folders';
  // A folder id that is not one of ours: deleted elsewhere, or a stale bookmark.
  const lostFolder = filter.kind === 'folder' && !loading && !folders.value.some((f) => f.id === filter.id);
  const shownFolders = folders.value.filter((folder) => matchesQuery({ query, fields: [folder.name] }));
  const count = onFolders ? shownFolders.length : list.length;
  return (
    <div class={cn(APP_MEASURE, 'py-8 sm:py-10')}>
      <div class="mb-5 flex items-end justify-between gap-4">
        <Heading filter={filter} count={count} />
        {all.length > 0 && (
          <a href="/" class={cn(submitBtn, 'shrink-0 no-underline')}>
            Start a list
          </a>
        )}
      </div>

      {all.length > 0 && (
        <div class="mb-4 flex flex-wrap items-center gap-2">
          <DashTabs filter={filter} />
          <div class="flex w-full min-w-0 items-center gap-2 sm:ml-auto sm:w-auto sm:flex-1 sm:justify-end">
            <SearchField placeholder={onFolders ? 'Search folders' : 'Search lists'} />
            {onFolders && <NewFolderButton />}
            <LayoutToggle />
          </div>
        </div>
      )}

      {loading ? (
        <Skeleton layout={layout} />
      ) : all.length === 0 ? (
        <Empty />
      ) : onFolders ? (
        <FolderIndex layout={layout} query={query} panel={PANEL} />
      ) : lostFolder ? (
        <div class={cn(PANEL, 'text-meta px-6 py-12 text-center text-(--ds-gray-900)')}>
          This folder is gone.{' '}
          <Link href={filterPath({ kind: 'folders' })} class="text-(--ds-gray-1000)">
            Back to folders
          </Link>
        </div>
      ) : list.length === 0 ? (
        <div class={cn(PANEL, 'text-meta px-6 py-12 text-center text-(--ds-gray-900)')}>
          {query.trim() ? (
            <>No list matches “{query.trim()}”.</>
          ) : (
            <>
              Nothing here yet. Use <span class="text-(--ds-gray-1000)">Move to folder</span> on a link.
            </>
          )}
        </div>
      ) : (
        <>
          <LinkCollection items={list} layout={layout} />
          {/* Said once, at the foot of the list, rather than re-explained on
              every row — which is what the per-row "unless opened" was doing. */}
          <p class="text-meta leading-body mt-3 text-(--ds-gray-900)">
            Links you keep here are not deleted. Give one an expiry in its settings if you want it to go, or remove it
            to put it back on the 90-day clock.
          </p>
        </>
      )}

      {/* The address, for the reader who lands here from a magic link and wants
          to know which account it signed them into. The bar carries it on wider
          screens; this is the small-screen answer. */}
      {account ? (
        <p class="text-meta mt-8 truncate text-(--ds-gray-900) sm:hidden">Signed in as {account.email}</p>
      ) : null}
      <FolderDialog />
    </div>
  );
}
