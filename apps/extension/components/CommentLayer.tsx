import { cn } from '@marklayer/types';
import { useSignalEffect } from '@preact/signals';
import { useCallback, useState } from 'preact/hooks';
import { applyAnchorDelta } from '../lib/anchor';
import { shootViewport } from '../lib/capture';
import { checkRequest, flashAnnotation } from '../lib/checkFix';
import { snapshotPin } from '../lib/pin-shot';
import { MARKER_LAYER } from '../lib/popover';
import { scrollPageTo } from '../lib/scroller';
import { captureTarget, pickElementAtPoint } from '../lib/selector';
import { fileUrl, transcribeFile, uploadFile } from '../lib/share';
import { activeTool, color, pushOp, rootComments } from '../lib/state';
import { CommentPin } from './CommentPin';
import { CommentPopover } from './CommentPopover';

interface PopoverState {
  x: number;
  y: number;
  el: Element | null;
  /** The screenshot around the pin, taken at the click so it shows what was clicked. */
  snapshot: Promise<string | null>;
}

export function CommentLayer() {
  const [popover, setPopover] = useState<PopoverState | null>(null);

  // The page is the user's own and already live, so a reload would cost their
  // scroll and form state; scrolling to the anchor and lighting the pin is enough.
  useSignalEffect(() => {
    const id = checkRequest.value;
    if (!id) return;
    checkRequest.value = null;
    const op = rootComments.peek().find((c) => c.id === id);
    if (!op) return;
    const { y } = applyAnchorDelta(op.target, { docX: op.x, docY: op.y });
    scrollPageTo(window, { top: Math.max(0, y - window.innerHeight / 3), behavior: 'smooth' });
    flashAnnotation(id);
  });

  const onClick = useCallback((e: MouseEvent) => {
    if (activeTool.value !== 'comment') return;
    const x = e.clientX + scrollX;
    const y = e.clientY + scrollY;
    const el = pickElementAtPoint(e.clientX, e.clientY);
    const snapshot = snapshotPin({
      shoot: shootViewport,
      pin: { x: e.clientX, y: e.clientY },
      viewport: { x: 0, y: 0, width: innerWidth, height: innerHeight },
      color: color.value,
      upload: uploadFile,
    });
    setPopover({ x, y, el, snapshot });
  }, []);

  return (
    <>
      {/* The click-capture is a sibling, not the pins' parent: MARKER_LAYER lifts above the
          toolbar while a card is held, and a lifted capture would take the toolbar's clicks. */}
      <div
        class="fixed inset-0 z-2147483646"
        onClick={onClick}
        style={{
          pointerEvents: activeTool.value === 'comment' ? 'auto' : 'none',
          cursor: activeTool.value === 'comment' ? 'crosshair' : 'default',
        }}
      />
      <div class={cn(MARKER_LAYER, 'pointer-events-none')}>
        {/* Placed pins */}
        {rootComments.value.map((c) => (
          <CommentPin key={c.id} op={c} />
        ))}

        {/* Input popover */}
        {popover && (
          <CommentPopover
            at={{ x: popover.x, y: popover.y }}
            anchorAt={{ x: popover.x - scrollX, y: popover.y - scrollY }}
            capture={() => ({
              target: popover.el
                ? captureTarget({ el: popover.el, anchor: { x: popover.x, y: popover.y } })
                : undefined,
              captureViewport: { width: window.innerWidth, height: window.innerHeight },
            })}
            push={pushOp}
            onClose={() => setPopover(null)}
            media={{
              upload: uploadFile,
              resolveUrl: fileUrl,
              voice: { transcribe: transcribeFile },
              snapshot: popover.snapshot,
            }}
          />
        )}
      </div>
    </>
  );
}
