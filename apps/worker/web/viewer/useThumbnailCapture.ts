import { type Signal, useSignalEffect } from '@preact/signals';
import { shootFrame } from '../frameShot';
import { annotationId, currentPageIdx, projectId, projectPages } from '../projects';
import { signedIn } from '../role';
import type { RenderFailure } from '../viewerFrame';
import { thumbnailTarget } from './thumbnailTarget';

/** Long enough for the hero image and web fonts to land after DOMContentLoaded reveals the frame. */
const SETTLE_MS = 2500;
/** A dashboard card does not need a fresher picture than this; every open re-uploading would. */
const REFRESH_MS = 12 * 60 * 60 * 1000;
const WIDTH = 640;
/** The card's own 16:10 frame, so the image fills it without a crop the reader would notice. */
const ASPECT = 10 / 16;
const STORAGE_PREFIX = 'marklayer:thumb:';

function capturedRecently(id: string): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(STORAGE_PREFIX + id) ?? 0) < REFRESH_MS;
  } catch {
    return false;
  }
}

function noteCaptured(id: string): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + id, String(Date.now()));
  } catch {
    // Storage blocked: the next open captures again, which costs one small upload.
  }
}

async function captureAndUpload({ frame, id }: { frame: HTMLIFrameElement; id: string }): Promise<void> {
  const width = frame.contentDocument?.documentElement.clientWidth ?? 0;
  if (width === 0) return;
  const bitmap = await shootFrame({ frame, crop: { x: 0, y: 0, width, height: Math.round(width * ASPECT) } });
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = Math.round(WIDTH * ASPECT);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // JPEG, not WebP: Safari cannot encode WebP from a canvas and would hand back a PNG ten times the size.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) return;
  const res = await fetch(`/auth/links/${encodeURIComponent(id)}/thumbnail`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  if (res.ok) noteCaptured(id);
}

/**
 * Keep the dashboard's picture of a list current, from the one place that
 * already has the page rendered: the team's own viewer. Clients never send one,
 * and the server ignores anyone but the list's owner.
 */
export function useThumbnailCapture({
  frameRef,
  iframeLoaded,
  renderFailed,
}: {
  frameRef: { current: HTMLIFrameElement | null };
  iframeLoaded: Signal<boolean>;
  renderFailed: Signal<RenderFailure | null>;
}): void {
  useSignalEffect(() => {
    if (!signedIn.value || !iframeLoaded.value || renderFailed.value) return;
    const id = thumbnailTarget({
      project: projectId.value,
      pages: projectPages.value,
      pageIdx: currentPageIdx.value,
      annotation: annotationId.value,
    });
    if (!id || capturedRecently(id)) return;
    const timer = window.setTimeout(() => {
      const frame = frameRef.current;
      // A failed capture is no worse than no capture: the card keeps its placeholder.
      if (frame) void captureAndUpload({ frame, id }).catch(() => undefined);
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  });
}
