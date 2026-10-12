import { useEffect } from 'preact/hooks';
import { tinykeys } from 'tinykeys';
import { CommentLayer } from '../components/CommentLayer';
import { Toasts } from '../components/Toasts';
import { useOverlayHost } from '../components/useOverlayHost';
import { activeTool } from '../lib/state';

/** The extension's overlay cut down to commenting: pins, the comment popover and toasts, nothing else. */
export function WidgetApp() {
  useOverlayHost();

  // tinykeys skips keys aimed at inputs, so an open comment keeps its own Escape.
  useEffect(
    () =>
      tinykeys(window, {
        Escape: () => {
          activeTool.value = 'navigate';
        },
      }),
    [],
  );

  return (
    <div class="pointer-events-auto">
      <CommentLayer />
      <Toasts />
    </div>
  );
}
