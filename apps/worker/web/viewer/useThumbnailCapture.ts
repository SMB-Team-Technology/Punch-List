import { type Signal, useSignalEffect } from '@preact/signals';
import { annotationId, currentPageIdx, projectId, projectPages } from '../projects';
import { signedIn } from '../role';
import { captureAndUpload, capturedRecently } from '../thumbnail';
import type { RenderFailure } from '../viewerFrame';
import { thumbnailTarget } from './thumbnailTarget';

/** Long enough for the hero image and web fonts to land after DOMContentLoaded reveals the frame. */
const SETTLE_MS = 2500;

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
