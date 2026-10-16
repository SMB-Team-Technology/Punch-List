import { Toggle } from '@base-ui/react/toggle';
import { GLYPH, geist } from '@ext/lib/geist';
import { glass } from '@ext/lib/glass';
import { Icon } from '@ext/lib/icons';
import { activeTool, rootComments, selectTool, showAnnotationPanel } from '@ext/lib/state';
import type { Tool } from '@ext/lib/types';
import { cn } from '@marklayer/types';
import { ListChecks, Lock } from 'lucide-preact';
import { hasReviewContent, panelChoice, reviewPanelOpen } from '../review';
import { ShareDrawer } from '../SharePopover';
import { isReadonly, PHONE_TOOLS } from '../signals';

function ToolButton({ tool, label }: { tool: Tool; label: string }) {
  const on = activeTool.value === tool;
  return (
    <Toggle
      pressed={on}
      onPressedChange={(pressed: boolean) => {
        if (pressed) selectTool({ tool, via: 'toolbar' });
      }}
      aria-label={label}
      className={cn(geist.ctl, on ? geist.ctlOn : geist.ctlIdle)}
    >
      <Icon name={tool} {...GLYPH} />
    </Toggle>
  );
}

/** Opens the threads sheet. Named and counted rather than an icon, so it never reads as the comment tool. */
function ThreadsButton() {
  const count = rootComments.value.length;
  const open = showAnnotationPanel.value;
  return (
    <button
      type="button"
      aria-pressed={open}
      onClick={() => {
        // One sheet at a time on a phone: the threads would bury the review panel under them.
        if (!open) panelChoice.value = false;
        showAnnotationPanel.value = !open;
      }}
      class={cn(geist.ctl, open ? geist.ctlOn : geist.ctlIdle, 'w-auto gap-1.5 px-3 text-ui font-medium')}
    >
      Threads
      <span class={cn('tabular-nums', !open && 'text-(--ds-gray-700)')}>{count}</span>
    </button>
  );
}

/** The review panel's toggle, offered only once there is something in it: a phone has no room for an empty one. */
function ReviewToggle() {
  if (!hasReviewContent.value) return null;
  const open = reviewPanelOpen.value;
  return (
    <button
      type="button"
      aria-pressed={open}
      aria-label="Next steps and questions"
      onClick={() => {
        if (!open) showAnnotationPanel.value = false;
        panelChoice.value = !open;
      }}
      class={cn(geist.ctl, open ? geist.ctlOn : geist.ctlIdle)}
    >
      <ListChecks {...GLYPH} aria-hidden="true" />
    </button>
  );
}

/**
 * The whole of the viewer's chrome on a phone, in the toolbar's own shell: the
 * two tools a finger can drive, the threads, and the link. A page this small has
 * no room for a top bar that only repeats its address.
 */
export function PhoneBar() {
  const readonly = isReadonly.value;
  return (
    <div
      class={cn(
        'fixed left-1/2 -translate-x-1/2 z-2147483646 flex items-center gap-1 p-1 select-none',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]',
        geist.surface,
        glass.font,
      )}
    >
      {readonly ? (
        // A guest gets the threads and nothing to draw with, so the bar says why.
        <span class="flex items-center gap-1.5 px-3 text-ui font-medium text-(--ds-gray-900)">
          <Lock size={14} strokeWidth={1.5} aria-hidden="true" />
          View only
        </span>
      ) : (
        PHONE_TOOLS.map((t) => <ToolButton key={t.tool} {...t} />)
      )}
      <div class={geist.sep} />
      <ThreadsButton />
      <ReviewToggle />
      {!readonly && <ShareDrawer />}
    </div>
  );
}
