import { Dialog } from '@base-ui/react/dialog';
import { Menu } from '@base-ui/react/menu';
import { submitBtn } from '@ext/lib/buttons';
import { geist } from '@ext/lib/geist';
import { portalContainer } from '@ext/lib/portal';
import { cn, type Folder, MAX_FOLDER_NAME_LENGTH, type OwnedLink } from '@marklayer/types';
import { computed, signal, useSignal } from '@preact/signals';
import { Check, Ellipsis, Folder as FolderIcon, FolderInput, FolderPlus } from 'lucide-preact';
import { Link, useLocation } from 'wouter-preact';
import {
  createFolder,
  deleteFolder,
  type FolderFilter,
  folders,
  type ListLayout,
  links,
  moveLink,
  renameFolder,
} from './session';

type DialogSpec = { kind: 'create' } | { kind: 'rename'; folder: Folder } | { kind: 'delete'; folder: Folder };

const dialog = signal<DialogSpec | null>(null);

export function openNewFolder(): void {
  dialog.value = { kind: 'create' };
}

const MENU_ITEM =
  'flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-ui cursor-pointer border-none transition-colors bg-transparent text-(--ds-gray-1000) hover:bg-(--ds-gray-alpha-100) data-highlighted:bg-(--ds-gray-alpha-100)';

/** The links a filter leaves on screen. The folder index shows folders, not links. */
export function inFilter({ link, filter }: { link: OwnedLink; filter: FolderFilter }): boolean {
  if (filter.kind === 'all') return true;
  if (filter.kind === 'folders') return false;
  return filter.kind === 'unfiled' ? link.folderId === null : link.folderId === filter.id;
}

/** Case-insensitive substring match on any of the given fields; an empty query matches everything. */
export function matchesQuery({ query, fields }: { query: string; fields: readonly string[] }): boolean {
  const needle = query.trim().toLowerCase();
  return needle === '' || fields.some((field) => field.toLowerCase().includes(needle));
}

/** Where each filter lives under `/app`. */
export function filterPath(filter: FolderFilter): string {
  if (filter.kind === 'all') return '/';
  if (filter.kind === 'unfiled') return '/unfiled';
  if (filter.kind === 'folders') return '/folders';
  return `/folders/${encodeURIComponent(filter.id)}`;
}

/**
 * All, Unfiled and Folders, and never one tab per folder: with a folder for every
 * client the chips ran to hundreds. A folder is opened from the Folders tab.
 */
export function DashTabs({ filter }: { filter: FolderFilter }) {
  const tabs: { label: string; target: FolderFilter; on: boolean }[] = [
    { label: 'All', target: { kind: 'all' }, on: filter.kind === 'all' },
    ...(folders.value.length > 0
      ? [{ label: 'Unfiled', target: { kind: 'unfiled' } as const, on: filter.kind === 'unfiled' }]
      : []),
    { label: 'Folders', target: { kind: 'folders' }, on: filter.kind === 'folders' || filter.kind === 'folder' },
  ];
  return (
    <nav aria-label="Lists" class={geist.track}>
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={filterPath(tab.target)}
          aria-current={tab.on ? 'page' : undefined}
          data-pressed={tab.on ? '' : undefined}
          class={cn(geist.segmentText, 'no-underline')}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

/** Per folder: how many lists, and how many threads are open across them. */
const folderTallies = computed(() => {
  const tallies = new Map<string, { lists: number; open: number }>();
  for (const link of links.value) {
    if (link.folderId === null) continue;
    const tally = tallies.get(link.folderId) ?? { lists: 0, open: 0 };
    tally.lists += 1;
    tally.open += link.site?.openCount ?? 0;
    tallies.set(link.folderId, tally);
  }
  return tallies;
});

function FolderTally({ id }: { id: string }) {
  const tally = folderTallies.value.get(id) ?? { lists: 0, open: 0 };
  return (
    <span class="text-meta tabular-nums text-(--ds-gray-900)">
      {tally.lists} {tally.lists === 1 ? 'list' : 'lists'}
      {tally.open > 0 && (
        <>
          <span class="px-1.5" aria-hidden="true">
            ·
          </span>
          <span class="font-medium text-(--ds-gray-1000)">
            <span class="mr-1 inline-block size-2 rounded-full bg-ml-green align-middle" aria-hidden="true" />
            {tally.open} open
          </span>
        </>
      )}
    </span>
  );
}

/** 44px on touch, 28px from `sm` up — the list rows' own control size. */
const FOLDER_CTL = 'size-11 sm:size-7';

/**
 * The Folders tab: every folder, as rows or as tiles. The whole row opens the
 * folder (a stretched link); its menu sits above that, as on a list row.
 */
export function FolderIndex({ layout, query, panel }: { layout: ListLayout; query: string; panel: string }) {
  const shown = folders.value.filter((folder) => matchesQuery({ query, fields: [folder.name] }));
  if (folders.value.length === 0) {
    return (
      <div class={cn(panel, 'flex flex-col items-center gap-2 px-6 py-16 text-center')}>
        <FolderIcon size={24} strokeWidth={1.5} class="text-(--ds-gray-700)" aria-hidden="true" />
        <span class="text-ui font-medium text-(--ds-gray-1000)">No folders yet</span>
        <span class="text-meta leading-body max-w-[28rem] text-balance text-(--ds-gray-900)">
          Make one per client, then file their lists into it with{' '}
          <span class="text-(--ds-gray-1000)">Move to folder</span>.
        </span>
        <button type="button" class={cn(submitBtn, 'mt-4')} onClick={openNewFolder}>
          New folder
        </button>
      </div>
    );
  }
  if (shown.length === 0) {
    return (
      <div class={cn(panel, 'text-meta px-6 py-12 text-center text-(--ds-gray-900)')}>
        No folder matches “{query.trim()}”.
      </div>
    );
  }
  if (layout === 'grid') {
    return (
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {shown.map((folder) => (
          <li
            key={folder.id}
            class={cn(panel, 'group relative flex flex-col gap-3 p-4 transition-colors hover:bg-(--ds-gray-alpha-100)')}
          >
            <div class="flex items-start justify-between gap-2">
              <span class="inline-flex size-10 items-center justify-center rounded-lg bg-(--ds-gray-alpha-100) text-(--ds-gray-900)">
                <FolderIcon size={20} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div class="relative -mt-1 -mr-1">
                <FolderActions folder={folder} class={cn(geist.ctlSm, geist.ctlIdle, FOLDER_CTL)} />
              </div>
            </div>
            <div class="flex min-w-0 flex-col gap-0.5">
              <Link
                href={filterPath({ kind: 'folder', id: folder.id })}
                class="text-ui tracking-ui block truncate font-medium text-(--ds-gray-1000) no-underline after:absolute after:inset-0 group-hover:underline"
              >
                {folder.name}
              </Link>
              <FolderTally id={folder.id} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul class={cn(panel, 'divide-y divide-(--ds-gray-alpha-400)')}>
      {shown.map((folder) => (
        <li
          key={folder.id}
          class="group relative flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-(--ds-gray-alpha-100)"
        >
          <FolderIcon size={16} strokeWidth={1.5} class="shrink-0 text-(--ds-gray-900)" aria-hidden="true" />
          <div class="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
            <Link
              href={filterPath({ kind: 'folder', id: folder.id })}
              class="text-ui tracking-ui truncate font-medium text-(--ds-gray-1000) no-underline after:absolute after:inset-0 group-hover:underline"
            >
              {folder.name}
            </Link>
            <FolderTally id={folder.id} />
          </div>
          <div class="relative shrink-0">
            <FolderActions folder={folder} class={cn(geist.ctlSm, geist.ctlIdle, FOLDER_CTL)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NewFolderButton() {
  return (
    <button
      type="button"
      aria-label="New folder"
      class={cn(geist.ctlSm, geist.ctlIdle, 'size-11 sm:size-8')}
      onClick={openNewFolder}
    >
      <FolderPlus size={16} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

export function FolderActions({ folder, class: className }: { folder: Folder; class: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label={`Actions for ${folder.name}`} className={className}>
        <Ellipsis size={14} strokeWidth={1.5} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal container={portalContainer.value ?? undefined}>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-2147483647">
          <Menu.Popup className={cn(geist.surface, 'min-w-40 p-1 text-ui text-(--ds-gray-1000)')}>
            <Menu.Item
              className={MENU_ITEM}
              onClick={() => {
                dialog.value = { kind: 'rename', folder };
              }}
            >
              Rename
            </Menu.Item>
            <Menu.Item
              className={cn(MENU_ITEM, 'hover:text-(--ds-red-700) data-highlighted:text-(--ds-red-700)')}
              onClick={() => {
                dialog.value = { kind: 'delete', folder };
              }}
            >
              Delete
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

const NO_FOLDER = '__none__';

/** The row's "Move to folder". A radio group, so the current folder is the checked one. */
export function MoveMenu({ link, class: className }: { link: OwnedLink; class: string }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Move to folder" className={className}>
        <FolderInput size={14} strokeWidth={1.5} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal container={portalContainer.value ?? undefined}>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-2147483647">
          <Menu.Popup className={cn(geist.surface, 'max-h-80 min-w-48 max-w-72 overflow-y-auto p-1 text-ui')}>
            <div class={cn(geist.sectionLabel, 'px-2.5 pt-1.5 pb-1')}>Move to folder</div>
            <Menu.RadioGroup
              value={link.folderId ?? NO_FOLDER}
              onValueChange={(value: string) =>
                void moveLink({ id: link.id, folderId: value === NO_FOLDER ? null : value })
              }
            >
              <FolderRadio label="No folder" value={NO_FOLDER} />
              {folders.value.map((folder) => (
                <FolderRadio key={folder.id} label={folder.name} value={folder.id} />
              ))}
            </Menu.RadioGroup>
            <div class="mx-2 my-1 h-px bg-(--ds-gray-alpha-400)" />
            <Menu.Item
              className={MENU_ITEM}
              onClick={() => {
                dialog.value = { kind: 'create' };
              }}
            >
              New folder…
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function FolderRadio({ label, value }: { label: string; value: string }) {
  return (
    <Menu.RadioItem value={value} className={cn(MENU_ITEM, 'data-checked:font-medium')}>
      <span class="truncate text-left">{label}</span>
      <Menu.RadioItemIndicator className="inline-flex shrink-0 text-(--ds-gray-900)">
        <Check size={14} strokeWidth={1.5} aria-hidden="true" />
      </Menu.RadioItemIndicator>
    </Menu.RadioItem>
  );
}

/** One dialog for create, rename and delete-confirm; mounted once by the dashboard. */
export function FolderDialog() {
  const spec = dialog.value;
  return (
    <Dialog.Root
      open={spec !== null}
      onOpenChange={(open: boolean) => {
        if (!open) dialog.value = null;
      }}
    >
      <Dialog.Portal container={portalContainer.value ?? undefined}>
        <Dialog.Backdrop className="fixed inset-0 z-2147483647 bg-black/50" />
        <Dialog.Popup
          className={cn(
            geist.surface,
            'fixed top-1/2 left-1/2 z-2147483647 w-[360px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 p-5',
          )}
        >
          {spec && <DialogBody spec={spec} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DialogBody({ spec }: { spec: DialogSpec }) {
  const name = useSignal(spec.kind === 'rename' ? spec.folder.name : '');
  const error = useSignal<string | null>(null);
  const busy = useSignal(false);
  const [location, navigate] = useLocation();

  const submit = async (event: Event) => {
    event.preventDefault();
    busy.value = true;
    if (spec.kind === 'delete') {
      await deleteFolder(spec.folder.id);
      dialog.value = null;
      // Deleted from inside it: the page it was on no longer exists.
      if (location === filterPath({ kind: 'folder', id: spec.folder.id })) navigate('/folders', { replace: true });
      return;
    }
    const failure =
      spec.kind === 'create'
        ? await createFolder(name.value)
        : await renameFolder({ id: spec.folder.id, name: name.value });
    busy.value = false;
    if (failure) error.value = failure;
    else dialog.value = null;
  };

  return (
    <form onSubmit={submit}>
      <Dialog.Title className="text-heading tracking-ui m-0 font-semibold text-(--ds-gray-1000)">
        {spec.kind === 'create' ? 'New folder' : spec.kind === 'rename' ? 'Rename folder' : 'Delete folder'}
      </Dialog.Title>
      {spec.kind === 'delete' ? (
        <Dialog.Description className="text-ui leading-body mt-2 mb-0 text-(--ds-gray-900)">
          Delete <span class="text-(--ds-gray-1000)">{spec.folder.name}</span>? Its links are not deleted, they move
          back to Unfiled.
        </Dialog.Description>
      ) : (
        <div class="mt-3 flex flex-col gap-2">
          <div class={cn(geist.field, 'flex h-11 items-center px-3 sm:h-10')}>
            <input
              type="text"
              required
              autofocus
              maxLength={MAX_FOLDER_NAME_LENGTH}
              aria-label="Folder name"
              aria-invalid={error.value ? 'true' : undefined}
              placeholder="Folder name"
              value={name.value}
              onInput={(event) => {
                name.value = event.currentTarget.value;
              }}
              /* 16px, not the text-ui step: iOS Safari zooms into any focused input below it. */
              class={cn(geist.input, 'w-full text-base')}
            />
          </div>
          {error.value ? (
            <p role="alert" class="text-meta m-0 text-(--ds-red-700)">
              {error.value}
            </p>
          ) : null}
        </div>
      )}
      <div class="mt-5 flex justify-end gap-2">
        <Dialog.Close className={cn(geist.actionBtn, geist.ctlIdle, 'mx-0')}>Cancel</Dialog.Close>
        <button
          type="submit"
          disabled={busy.value || (spec.kind !== 'delete' && name.value.trim() === '')}
          class={cn(
            spec.kind === 'delete'
              ? cn(geist.actionBtn, 'mx-0 text-(--ds-red-700) hover:bg-(--ds-gray-alpha-100)')
              : submitBtn,
            'disabled:opacity-50',
          )}
        >
          {spec.kind === 'create' ? 'Create' : spec.kind === 'rename' ? 'Save' : 'Delete'}
        </button>
      </div>
    </form>
  );
}
