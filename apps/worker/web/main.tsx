import { initHost } from '@ext/lib/host';
import { render } from 'preact';
import { App } from './App';
import { initAnalytics, markReloading } from './analytics';
import { applyTheme } from './applyTheme';
import { bootFromUrl } from './boot';
import { webHost } from './host';
import { startViewerRole } from './role';
import { shareRoom } from './share-room';
import { isLanding, isStillFrame } from './viewer-state';
import './style.css';

bootFromUrl();
// After `bootFromUrl`, which is what knows this is a room: the marketing page has none to share.
initHost(webHost({ share: !isLanding.peek(), actions: { onShare: () => void shareRoom() } }));

// A deploy deletes the last build's chunks, so a tab opened before it fails its next lazy
// import. Reload into the new build, at most once a minute so a chunk that is genuinely
// unreachable (offline, blocked) still surfaces as an error instead of a reload loop.
const RELOADED_AT = 'marklayer:chunk-reload';
window.addEventListener('vite:preloadError', () => {
  try {
    if (Date.now() - Number(sessionStorage.getItem(RELOADED_AT)) < 60_000) return;
    sessionStorage.setItem(RELOADED_AT, String(Date.now()));
  } catch {
    return;
  }
  markReloading();
  location.reload();
});

applyTheme();

// Before render, so events from the first mount are counted rather than dropped.
// `.env.local` holds the production key, so `bun dev` would otherwise fill PostHog
// with our own localhost sessions and replays. Nothing here is a real user.
initAnalytics({
  key: import.meta.env.DEV ? undefined : import.meta.env.VITE_PUBLIC_POSTHOG_KEY,
  surface: isLanding.peek() ? 'landing' : isStillFrame.value ? 'demo' : 'viewer',
});

// Before the first render, so a client never sees the team's toolbar flash past.
if (!isLanding.peek()) startViewerRole();

const root = document.getElementById('app')!;
root.innerHTML = '';
render(<App />, root);
