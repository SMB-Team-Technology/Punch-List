/// <reference types="vite/client" />
import { effect } from '@preact/signals';
import { render } from 'preact';
import css from '../entrypoints/content/style.css?inline';
import { portalContainer } from '../lib/portal';
import { joinRoom } from '../lib/room';
import { activeTool, toast, visible } from '../lib/state';
import { adoptStyles } from './styles';
import { WidgetApp } from './WidgetApp';

export interface WidgetController {
  toggle: () => void;
}

/**
 * Mounts the overlay on this page bound to `roomId`, or resolves null when the room
 * will not load. `onCommentingChange` lets the loader's button follow Escape.
 */
export async function start({
  roomId,
  onCommentingChange,
}: {
  roomId: string;
  onCommentingChange: (on: boolean) => void;
}): Promise<WidgetController | null> {
  if (!(await joinRoom({ id: roomId }))) return null;

  // <mark-layer> by name: the element picker and theme sync both look the host up by tag.
  const host = document.createElement('mark-layer');
  const root = host.attachShadow({ mode: 'open' });
  adoptStyles({ root, css });
  const container = document.createElement('div');
  container.classList.add('ml-root');
  root.append(container);
  // On <html> and in the top layer, for the reasons spelled out in entrypoints/content/index.tsx.
  document.documentElement.append(host);
  if ('popover' in host) {
    host.popover = 'manual';
    try {
      host.showPopover();
    } catch {
      // Not supported or already open; the :host rules still pin the overlay.
    }
  }

  portalContainer.value = container;
  visible.value = true;
  render(<WidgetApp />, container);
  effect(() => onCommentingChange(activeTool.value === 'comment'));

  return {
    toggle: () => {
      const on = activeTool.peek() !== 'comment';
      activeTool.value = on ? 'comment' : 'navigate';
      if (on) toast('Click anything on the page to comment on it');
    },
  };
}
