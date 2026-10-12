import { Tooltip } from '@ext/components/Tooltip';
import { findPageScroller, notePageScroller, scrollOffset, scrollPageBy } from '@ext/lib/scroller';
import { bumpAnchorGeneration, focusedAnnotationId, rootComments, showAnnotationPanel } from '@ext/lib/state';
import type { CommentOp, DeviceMode } from '@ext/lib/types';
import { cn, isSettled, resolveOpStatus } from '@marklayer/types';
import { computed, signal, useSignalEffect } from '@preact/signals';
import { useLayoutEffect, useRef } from 'preact/hooks';
import { tinykeys } from 'tinykeys';
import { frameSrc, hideScrollbars } from './docSource';
import { resolveAnchors } from './iframeOverlay';
import { DEVICE_ICONS, DEVICE_LABELS } from './shared';
import { DEVICE_WIDTHS, deviceMode, deviceOverview, originalWidth, pageUrl } from './signals';
import { useViewerFrame } from './viewerFrame';

const MODES: readonly DeviceMode[] = ['desktop', 'tablet', 'mobile'];
/** How much of the page a frame shows: one screen of it. Desktop takes a 16:10 screen at its width. */
const VIEWPORT_H = { tablet: 1024, mobile: 844 } as const;
const DESKTOP_RATIO = 0.625;
const FALLBACK_DESKTOP_W = 1280;
/** World px between frames. */
const GAP = 120;
/** Screen px kept clear around the frames when fitting. */
const PAD = 56;
/** Screen px above a frame for its label. */
const LABEL_H = 28;
const MIN_Z = 0.05;
const MAX_Z = 4;
const STOPS = [0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];
/** Travel before a press becomes a pan, so a slightly shaky click still opens the frame. */
const DRAG_SLOP = 4;

interface Frame {
  mode: DeviceMode;
  x: number;
  w: number;
  h: number;
}
interface Pin {
  op: CommentOp;
  x: number;
  y: number;
}

const stageSize = signal({ w: 0, h: 0 });
/** Screen offset of the world origin, and the world-to-screen scale. */
const cam = signal({ x: 0, y: 0, z: 1 });
/** Set once the visitor pans or zooms, so a resize stops refitting the view under them. */
const touched = signal(false);
const panning = signal(false);
const frameDocs = signal<Partial<Record<DeviceMode, Document>>>({});
/** Bumped when a frame's page reflows (late fonts, lazy images), so its pins re-resolve. */
const layoutTick = signal(0);
/** Each frame's page scroll, so its pins move with the page under them. */
const frameScroll = signal<Partial<Record<DeviceMode, number>>>({});

const frames = computed<Frame[]>(() => {
  let x = 0;
  return MODES.map((mode) => {
    const w = mode === 'desktop' ? originalWidth.value || FALLBACK_DESKTOP_W : DEVICE_WIDTHS[mode];
    const h = mode === 'desktop' ? Math.round(w * DESKTOP_RATIO) : VIEWPORT_H[mode];
    const frame = { mode, x, w, h };
    x += w + GAP;
    return frame;
  });
});

const extent = computed(() => ({
  w: Math.max(...frames.value.map((f) => f.x + f.w)),
  h: Math.max(...frames.value.map((f) => f.h)),
}));

const clampZ = (z: number) => Math.min(MAX_Z, Math.max(MIN_Z, z));

const fitZoom = computed(() => {
  const { w, h } = stageSize.value;
  return clampZ(Math.min((w - PAD * 2) / extent.value.w, (h - PAD * 2 - LABEL_H) / extent.value.h, 1));
});

export const canvasZoom = computed(() => cam.value.z);
export const canvasFitted = computed(() => !touched.value);

function fitCanvas() {
  const { w, h } = stageSize.value;
  const z = fitZoom.value;
  cam.value = { z, x: (w - extent.value.w * z) / 2, y: (h - extent.value.h * z + LABEL_H) / 2 };
}

/** An explicit fit hands the view back to auto-fit, so a resize after it refits again. */
function refit() {
  touched.value = false;
  fitCanvas();
}

/** Zoom keeping the world point under `at` (stage px) where it is. */
function zoomAt({ z, at }: { z: number; at: { x: number; y: number } }) {
  const c = cam.value;
  const next = clampZ(z);
  touched.value = true;
  cam.value = { z: next, x: at.x - ((at.x - c.x) * next) / c.z, y: at.y - ((at.y - c.y) * next) / c.z };
}

function panBy(dx: number, dy: number) {
  touched.value = true;
  cam.value = { ...cam.value, x: cam.value.x + dx, y: cam.value.y + dy };
}

const stageCenter = () => ({ x: stageSize.value.w / 2, y: stageSize.value.h / 2 });

function zoomCanvasTo(z: number) {
  zoomAt({ z, at: stageCenter() });
}

function stepCanvasZoom(dir: 1 | -1) {
  const z = cam.value.z;
  const next = dir > 0 ? STOPS.find((s) => s > z + 0.001) : [...STOPS].reverse().find((s) => s < z - 0.001);
  if (next !== undefined) zoomCanvasTo(next);
}

export function toggleCanvasFit() {
  if (canvasFitted.value) zoomCanvasTo(1);
  else refit();
}

const openComments = computed(() => {
  const byMode: Partial<Record<DeviceMode, CommentOp[]>> = {};
  for (const op of rootComments.value) {
    if (isSettled(resolveOpStatus(op))) continue;
    const mode = op.device ?? 'desktop';
    byMode[mode] = [...(byMode[mode] ?? []), op];
  }
  return byMode;
});

/** Open comments resolved against each frame's own page, in that page's document coordinates. */
const framePins = computed(() => {
  void layoutTick.value;
  const byMode: Partial<Record<DeviceMode, Pin[]>> = {};
  for (const f of frames.value) {
    const doc = frameDocs.value[f.mode];
    byMode[f.mode] = (openComments.value[f.mode] ?? [])
      .map((op) => {
        const at = doc ? resolveAnchors({ target: op.target, pdf: op.pdf, docX: op.x, docY: op.y, doc }) : op;
        return { op, x: at.x, y: at.y };
      })
      .filter((p) => p.x >= 0 && p.x <= f.w);
  }
  return byMode;
});

function pick(mode: DeviceMode) {
  deviceMode.value = mode;
  deviceOverview.value = false;
}

/** The frame under a stage point, if any: the wheel scrolls its page instead of panning. */
function frameAt(at: { x: number; y: number }): Frame | undefined {
  const { x, y, z } = cam.value;
  const wx = (at.x - x) / z;
  const wy = (at.y - y) / z;
  return frames.value.find((f) => wx >= f.x && wx <= f.x + f.w && wy >= 0 && wy <= f.h);
}

function trackScroll({ mode, doc, win }: { mode: DeviceMode; doc: Document; win: Window }) {
  findPageScroller(doc);
  // A reload starts the new page at its top; the last page's offset would misplace every pin.
  frameScroll.value = { ...frameScroll.value, [mode]: scrollOffset(win).y };
  let queued = false;
  // Capture phase: an app-shell page scrolls an element, whose scroll event never bubbles.
  doc.addEventListener(
    'scroll',
    (e) => {
      notePageScroller(doc, e.target);
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        frameScroll.value = { ...frameScroll.value, [mode]: scrollOffset(win).y };
      });
    },
    true,
  );
}

function trackLayout(doc: Document) {
  const Observer = doc.defaultView?.ResizeObserver;
  if (!Observer) return;
  let queued = false;
  // Dies with the frame's document, so it needs no teardown of its own.
  new Observer(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      // The anchor cache keeps a miss until the generation moves, so an SPA's late render would never re-anchor.
      bumpAnchorGeneration();
      layoutTick.value++;
    });
  }).observe(doc.documentElement);
}

function FramePage({ frame }: { frame: Frame }) {
  const { mode, x, w, h } = frame;
  return (
    <iframe
      title={`${DEVICE_LABELS[mode]} preview`}
      src={pageUrl.value ? frameSrc({ url: pageUrl.value }) : undefined}
      sandbox="allow-scripts allow-same-origin"
      tabIndex={-1}
      aria-hidden="true"
      class="ph-no-capture absolute top-0 border-none bg-white pointer-events-none"
      style={{ left: x, width: w, height: h }}
      onLoad={(e) => {
        const doc = e.currentTarget.contentDocument;
        if (!doc) return;
        // A scrollbar in a frame is noise; the wheel scrolls it from here instead.
        hideScrollbars(doc);
        trackLayout(doc);
        if (doc.defaultView) trackScroll({ mode, doc, win: doc.defaultView });
        frameDocs.value = { ...frameDocs.value, [mode]: doc };
      }}
    />
  );
}

/**
 * Label, hit area and pins for one frame, in screen space: they keep their size
 * at any zoom, the way a design tool's frame names and comment pins do.
 */
function FrameChrome({
  frame,
  onPick,
  onPin,
}: {
  frame: Frame;
  onPick: (mode: DeviceMode) => void;
  onPin: (target: { pin: Pin; mode: DeviceMode }) => void;
}) {
  const { mode, x, w, h } = frame;
  const { x: cx, y: cy, z } = cam.value;
  const left = cx + x * z;
  const width = w * z;
  const Icon = DEVICE_ICONS[mode];
  const count = openComments.value[mode]?.length ?? 0;
  const scrollY = frameScroll.value[mode] ?? 0;
  const pins = framePins.value[mode]?.filter((p) => p.y >= scrollY && p.y <= scrollY + h) ?? [];
  return (
    <>
      <div
        class="absolute flex items-end gap-1.5 pb-2 text-meta text-(--ds-gray-900) whitespace-nowrap overflow-hidden pointer-events-none"
        style={{ left, top: cy - LABEL_H, width, height: LABEL_H }}
      >
        <Icon size={13} strokeWidth={1.5} aria-hidden="true" class="shrink-0 mb-px" />
        <span class={cn('font-medium', deviceMode.value === mode && 'text-(--ds-gray-1000)')}>
          {DEVICE_LABELS[mode]}
        </span>
        <span class="tabular-nums text-(--ds-gray-700) truncate">
          {w} × {h}
        </span>
        {count > 0 && <span class="ml-auto pl-2 tabular-nums text-(--ds-gray-1000)">{count} open</span>}
      </div>
      <button
        type="button"
        aria-label={`Edit on ${DEVICE_LABELS[mode].toLowerCase()}`}
        onClick={() => onPick(mode)}
        class="absolute cursor-pointer border-none bg-transparent outline-none
               shadow-[0_0_0_1px_var(--ds-gray-alpha-400)] hover:shadow-[0_0_0_1px_var(--ds-gray-alpha-700)]
               focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-focus-color)
               transition-shadow duration-150"
        style={{ left, top: cy, width, height: h * z }}
      />
      {pins.map((pin) => (
        <button
          key={pin.op.id}
          type="button"
          aria-label={`Comment ${pin.op.num} on ${DEVICE_LABELS[mode].toLowerCase()}`}
          onClick={() => onPin({ pin, mode })}
          // Matches the stage's pin: flat fill, a surface ring that thickens on hover, one tight shadow.
          class="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-none text-white text-meta font-semibold
                 grid place-items-center cursor-pointer outline-none
                 shadow-[0_0_0_2px_var(--ds-background-100),0_1px_2px_oklch(0_0_0/0.25)]
                 hover:shadow-[0_0_0_3px_var(--ds-background-100),0_1px_2px_oklch(0_0_0/0.3)]
                 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-focus-color)
                 transition-shadow duration-150 ease-out"
          style={{ left: left + pin.x * z, top: cy + (pin.y - scrollY) * z, background: pin.op.color }}
        >
          {pin.op.num}
          <Tooltip text={pin.op.text || 'Comment'} wrap />
        </button>
      ))}
    </>
  );
}

/** Every device side by side on a pannable, zoomable canvas. Picking a frame or a pin opens that device. */
export function DeviceOverview() {
  const stageRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  /** A press that turned into a pan must not also land as a click on the frame under it. */
  const panned = useRef(false);
  const {
    actions: { scrollToAnnotation },
  } = useViewerFrame();
  const open = deviceOverview.value;

  // Until the visitor moves the view, it follows the stage size and the desktop width.
  useSignalEffect(() => {
    if (deviceOverview.value && stageSize.value.w > 0 && !touched.value) fitCanvas();
  });

  // Wheel, Safari's gesture events, ResizeObserver and tinykeys are not signal-aware. A layout
  // effect, so a reopen measures and refits before the first paint instead of flashing the last camera.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!open || !el) return;
    touched.value = false;
    const measure = () => {
      stageSize.value = { w: el.clientWidth, h: el.clientHeight };
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    const local = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top };
    };
    // Trackpads pinch as a ctrl+wheel; ⌘+wheel zooms too, as in Figma. A plain wheel over a
    // frame scrolls its page, anywhere else it pans; drag pans everywhere.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const unit =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? el.clientHeight
            : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (e.ctrlKey || e.metaKey) {
        // A mouse wheel notch is ~100px against a pinch's few; clamping keeps one notch a sane step.
        const step = Math.max(-50, Math.min(50, dy));
        zoomAt({ z: cam.value.z * Math.exp(-step * 0.01), at: local(e.clientX, e.clientY) });
        return;
      }
      if (e.shiftKey && dx === 0) {
        panBy(-dy, 0);
        return;
      }
      const over = frameAt(local(e.clientX, e.clientY));
      const win = over && frameDocs.value[over.mode]?.defaultView;
      if (!win) {
        panBy(-dx, -dy);
        return;
      }
      // Locked to the dominant axis, so a vertical swipe's sideways jitter doesn't drift the canvas.
      // Divided by the zoom so the page tracks the gesture on screen.
      if (Math.abs(dx) > Math.abs(dy)) panBy(-dx, 0);
      else scrollPageBy(win, 0, dy / cam.value.z);
    };
    // Safari reports a trackpad pinch as gesture events, not ctrl+wheel. GestureEvent is not in the DOM lib.
    let gestureFrom = 1;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureFrom = cam.value.z;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      if (!('scale' in e) || typeof e.scale !== 'number') return;
      const at =
        e instanceof UIEvent &&
        'clientX' in e &&
        typeof e.clientX === 'number' &&
        'clientY' in e &&
        typeof e.clientY === 'number'
          ? local(e.clientX, e.clientY)
          : stageCenter();
      zoomAt({ z: gestureFrom * e.scale, at });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart);
    el.addEventListener('gesturechange', onGestureChange);

    const pd = (fn: () => void) => (e: KeyboardEvent) => {
      e.preventDefault();
      fn();
    };
    const unbind = tinykeys(window, {
      Escape: () => {
        deviceOverview.value = false;
      },
      'Shift+Digit1': pd(refit),
      'Shift+Digit0': pd(() => zoomCanvasTo(1)),
      '$mod+Digit0': pd(refit),
      '$mod+Equal': pd(() => stepCanvasZoom(1)),
      '$mod+Minus': pd(() => stepCanvasZoom(-1)),
    });
    return () => {
      ro.disconnect();
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      unbind();
      frameDocs.value = {};
      frameScroll.value = {};
      stageSize.value = { w: 0, h: 0 };
      panning.value = false;
    };
  }, [open]);

  if (!open) return null;

  const onPin = ({ pin, mode }: { pin: Pin; mode: DeviceMode }) => {
    if (panned.current) return;
    focusedAnnotationId.value = pin.op.id;
    showAnnotationPanel.value = true;
    pick(mode);
    // The stage takes the new width on the next render; the pin's place in it is the one resolved here.
    requestAnimationFrame(() => scrollToAnnotation(pin.x, pin.y));
  };
  const onPick = (mode: DeviceMode) => {
    if (!panned.current) pick(mode);
  };
  const { x, y, z } = cam.value;

  return (
    <div
      ref={stageRef}
      role="dialog"
      aria-label="All devices"
      class={cn(
        'absolute inset-0 z-40 overflow-hidden bg-ml-bg-device touch-none select-none',
        panning.value ? 'cursor-grabbing **:cursor-grabbing!' : 'cursor-grab',
      )}
      onPointerDown={(e) => {
        // Primary drags anywhere; middle drags too, without the browser's autoscroll.
        if (e.button !== 0 && e.button !== 1) return;
        if (e.button === 1) e.preventDefault();
        panned.current = false;
        press.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const p = press.current;
        if (!p || p.id !== e.pointerId) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        if (!p.moved) {
          if (Math.hypot(dx, dy) < DRAG_SLOP) return;
          p.moved = true;
          panned.current = true;
          panning.value = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        p.x = e.clientX;
        p.y = e.clientY;
        panBy(dx, dy);
      }}
      onPointerUp={() => {
        press.current = null;
        panning.value = false;
        // Past this pointerup's own click, so a keyboard press on a frame afterwards still lands.
        if (panned.current) setTimeout(() => (panned.current = false));
      }}
      onPointerCancel={() => {
        press.current = null;
        panning.value = false;
      }}
    >
      {stageSize.value.w > 0 && (
        <>
          <div
            class="absolute top-0 left-0 origin-top-left"
            style={{ transform: `translate(${x}px, ${y}px) scale(${z})` }}
          >
            {frames.value.map((f) => (
              <FramePage key={f.mode} frame={f} />
            ))}
          </div>
          {frames.value.map((f) => (
            <FrameChrome key={f.mode} frame={f} onPick={onPick} onPin={onPin} />
          ))}
        </>
      )}
    </div>
  );
}
