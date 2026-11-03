import { frameSrc } from '../docSource';
import { captureAndUpload, THUMBNAIL_ASPECT } from '../thumbnail';

const FRAME_WIDTH = 1280;
/** Past `load`: web fonts, the hero image and a PDF's first page render after it fires. */
const SETTLE_MS = 3000;
/** A page that has not loaded by now is not going to make a good picture. */
const LOAD_TIMEOUT_MS = 20_000;
/** One failed attempt per list per browser per this long, so a blocked site is not refetched on every dashboard open. */
const RETRY_MS = 12 * 60 * 60 * 1000;

function triedRecently(id: string): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(`marklayer:thumb-try:${id}`) ?? 0) < RETRY_MS;
  } catch {
    return false;
  }
}

function noteTried(id: string): void {
  try {
    localStorage.setItem(`marklayer:thumb-try:${id}`, String(Date.now()));
  } catch {
    // Storage blocked: a retry on the next open costs one page load.
  }
}

function loaded(frame: HTMLIFrameElement): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(false), LOAD_TIMEOUT_MS);
    frame.addEventListener(
      'load',
      () => {
        clearTimeout(timer);
        resolve(true);
      },
      { once: true },
    );
  });
}

async function shoot({ id, url }: { id: string; url: string }): Promise<boolean> {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.tabIndex = -1;
  // In the viewport but invisible: an off-screen frame never intersects, so lazy-loaded images in it never load.
  Object.assign(frame.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: `${FRAME_WIDTH}px`,
    height: `${Math.round(FRAME_WIDTH * THUMBNAIL_ASPECT)}px`,
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  frame.src = frameSrc({ url });
  const ready = loaded(frame);
  document.body.appendChild(frame);
  try {
    if (!(await ready)) return false;
    await new Promise((resolve) => window.setTimeout(resolve, SETTLE_MS));
    return await captureAndUpload({ frame, id });
  } catch {
    return false;
  } finally {
    frame.remove();
  }
}

const pending = new Map<string, Promise<boolean>>();
let queue: Promise<unknown> = Promise.resolve();

/**
 * Takes the picture a list has never had, for lists the owner has not opened in
 * the viewer since thumbnails shipped. One page at a time: each is a full page
 * load, and a dashboard can hold hundreds of cards.
 */
export function backfillThumbnail({ id, url }: { id: string; url: string }): Promise<boolean> {
  const running = pending.get(id);
  if (running) return running;
  if (triedRecently(id)) return Promise.resolve(false);
  const job = queue.then(() => {
    noteTried(id);
    return shoot({ id, url });
  });
  queue = job;
  pending.set(id, job);
  return job;
}
