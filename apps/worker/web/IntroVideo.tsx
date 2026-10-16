import { Menu } from '@base-ui/react/menu';
import { useVideoNote, VideoButton, VideoDraft, VideoLive } from '@ext/components/VideoNote';
import { VideoPlayer } from '@ext/components/VideoPlayer';
import { secondaryBtn, submitBtn } from '@ext/lib/buttons';
import { geist } from '@ext/lib/geist';
import { color, deleteOp, lineWidth, operations, pushOp, signedBy } from '@ext/lib/state';
import { timeAgo } from '@ext/lib/time';
import { cn, type IntroOp } from '@marklayer/types';
import { computed, signal } from '@preact/signals';
import { ChevronDown, Ellipsis } from 'lucide-preact';
import { nanoid } from 'nanoid';
import { useEffect } from 'preact/hooks';
import { capture } from './analytics';
import { fileUrl, isReadonly, uploadVideo } from './signals';

/** In the room's append order, not by `ts`: a peer's skewed clock must not demote the take they just pinned. */
export const intros = computed(() => operations.value.filter((op): op is IntroOp => op.tool === 'intro'));

export const introComposerOpen = signal(false);

/** The version picked from the menu; null follows the newest, so a fresh take shows without a click. */
const pickedId = signal<string | null>(null);

const menuItem = cn(
  'flex items-center gap-2 h-8 px-2 rounded-md cursor-pointer border-none bg-transparent outline-none',
  'text-ui text-(--ds-gray-1000) transition-colors duration-150',
  'data-highlighted:bg-(--ds-gray-alpha-100)',
);

function VersionMenu({ list, shown }: { list: IntroOp[]; shown: IntroOp }) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Choose a version"
        className={cn(geist.ctlXs, geist.ctlIdle, geist.ctlLabel, 'tabular-nums')}
      >
        V{list.indexOf(shown) + 1}
        <ChevronDown size={12} strokeWidth={1.75} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-2147483647">
          <Menu.Popup className={cn(geist.surface, 'min-w-48 p-1 flex flex-col gap-px')}>
            {list
              .map((op, i) => ({ op, n: i + 1 }))
              .reverse()
              .map(({ op, n }) => (
                <Menu.Item
                  key={op.id}
                  className={cn(menuItem, op.id === shown.id && 'font-semibold')}
                  onClick={() => (pickedId.value = op.id === list.at(-1)?.id ? null : op.id)}
                >
                  <span class="tabular-nums w-6">V{n}</span>
                  <span class="flex-1 truncate">{op.author || 'Anonymous'}</span>
                  <span class="text-meta text-(--ds-gray-900) tabular-nums">{timeAgo(op.ts)}</span>
                </Menu.Item>
              ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function IntroActions({ shown }: { shown: IntroOp }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Intro video actions" title="More" className={cn(geist.ctlXs, geist.ctlIdle)}>
        <Ellipsis size={14} strokeWidth={1.5} aria-hidden="true" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={4} className="z-2147483647">
          <Menu.Popup className={cn(geist.surface, 'min-w-44 p-1 flex flex-col gap-px')}>
            <Menu.Item className={menuItem} onClick={() => (introComposerOpen.value = true)}>
              Record a new version
            </Menu.Item>
            <Menu.Item
              className={cn(menuItem, 'data-highlighted:text-(--ds-red-700)')}
              onClick={() => {
                // deleteOp has no undo, and the take may be someone else's.
                if (!window.confirm('Delete this version of the intro video?')) return;
                pickedId.value = null;
                deleteOp(shown.id);
              }}
            >
              Delete this version
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function IntroComposer() {
  const video = useVideoNote({ upload: uploadVideo });
  const status = video.status.value;
  const id = video.id.value;
  // Closing the panel ends the take (the recorder releases the device on unmount), so it ends the composer too.
  useEffect(
    () => () => {
      introComposerOpen.value = false;
    },
    [],
  );
  const close = () => {
    video.clear();
    introComposerOpen.value = false;
  };
  const save = (e: SubmitEvent) => {
    e.preventDefault();
    if (!id) return;
    const field = e.currentTarget instanceof HTMLFormElement ? e.currentTarget.elements.namedItem('title') : null;
    const title = field instanceof HTMLInputElement ? field.value.trim() : '';
    pushOp({
      id: nanoid(),
      tool: 'intro',
      video: id,
      title: title || undefined,
      color: color.value,
      lineWidth: lineWidth.value,
      ts: Date.now(),
      ...signedBy(),
    });
    capture('intro_video_posted', { version: intros.value.length });
    pickedId.value = null;
    introComposerOpen.value = false;
  };
  const idle = !id && status !== 'recording' && status !== 'working';

  return (
    <form onSubmit={save} class="p-3 border-b border-(--ds-gray-alpha-400)">
      <p class="m-0 text-ui font-semibold text-(--ds-gray-1000)">Intro video</p>
      <p class="m-0 mt-0.5 text-meta text-(--ds-gray-900) leading-snug">
        Pinned above the comments, so reviewers hear what you need before they start.
      </p>
      <VideoLive video={video} />
      <VideoDraft video={video} resolveUrl={fileUrl} />
      {id && (
        <input
          name="title"
          type="text"
          maxLength={120}
          placeholder="Title (optional)"
          aria-label="Intro title"
          class="mt-2 block w-full h-8 px-2 rounded-md text-ui text-(--ds-gray-1000) bg-(--ds-background-100)
                 border border-(--ds-gray-alpha-400) outline-none focus:border-(--ds-gray-700)"
        />
      )}
      <div class="mt-2 flex items-center gap-1.5">
        {idle && <VideoButton video={video} label />}
        <button type="button" onClick={close} class={cn(secondaryBtn, 'ml-auto h-7 px-2.5')}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={!id}
          class={cn(
            submitBtn,
            'h-7 px-2.5',
            'disabled:pointer-events-none disabled:bg-(--ds-gray-alpha-200) disabled:text-(--ds-gray-700)',
          )}
        >
          Pin video
        </button>
      </div>
    </form>
  );
}

/** Mounted above the panel's list/detail switch, so opening a thread mid-take does not discard the recording. */
export function IntroComposerSlot() {
  return introComposerOpen.value && !isReadonly.value ? <IntroComposer /> : null;
}

/** The room's pinned walkthrough at the head of the annotation list, with its version history. */
export function IntroVideo() {
  if (introComposerOpen.value) return null;
  const list = intros.value;
  const latest = list.at(-1);
  if (!latest) return null;
  const shown = list.find((op) => op.id === pickedId.value) ?? latest;
  return (
    <section aria-label="Intro video" class="p-3 border-b border-(--ds-gray-alpha-400)">
      <VideoPlayer key={shown.id} id={shown.video} resolveUrl={fileUrl} />
      <div class="mt-2 flex items-center gap-1">
        <div class="min-w-0 flex-1">
          <p class="m-0 text-ui font-semibold text-(--ds-gray-1000) truncate">{shown.title || 'Intro'}</p>
          <p class="m-0 text-meta text-(--ds-gray-900) truncate">
            {shown.author || 'Anonymous'} · {timeAgo(shown.ts)}
          </p>
        </div>
        {list.length > 1 && <VersionMenu list={list} shown={shown} />}
        {!isReadonly.value && <IntroActions shown={shown} />}
      </div>
    </section>
  );
}
