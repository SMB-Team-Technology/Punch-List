import { useSignalEffect } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { useRoomConnection } from '../lib/room';
import { ensureHostMutationObserver, ensureScrollTickListener, theme } from '../lib/state';

/** What every overlay on a live page needs, shared by the extension's App and the embeddable widget. */
export function useOverlayHost() {
  // One rAF-coalesced scroll listener and one host MutationObserver feed every layer
  // that repositions on scroll or re-resolves selectors on reflow / SPA routing.
  useEffect(() => {
    ensureScrollTickListener();
    ensureHostMutationObserver();
  }, []);

  useRoomConnection();

  // Sync theme class to shadow host
  useSignalEffect(() => {
    const t = theme.value;
    const host = document.querySelector('mark-layer')?.shadowRoot?.host;
    if (!host) return;
    host.classList.remove('ml-dark', 'ml-light');
    t !== 'system' && host.classList.add(t === 'dark' ? 'ml-dark' : 'ml-light');
  });
}
