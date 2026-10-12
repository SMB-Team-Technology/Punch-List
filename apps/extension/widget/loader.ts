/**
 * widget.js — the stable URL a site owner pastes. Draws one button and nothing
 * else; the overlay bundle loads on the first click. No Preact and no shared
 * modules beyond ./match and ./styles, because every visitor of the host page downloads this.
 */
import type { start, WidgetController } from './app';
import { projectPageForPage, roomForPage } from './match';
import { adoptStyles } from './styles';

/** The hashed app bundle's path, filled in by widget/build.ts after the app is built. */
declare const __WIDGET_APP__: string;

// Read synchronously: `currentScript` is null once this tick ends, async or not.
const current = document.currentScript;
const script =
  current instanceof HTMLScriptElement
    ? current
    : document.querySelector<HTMLScriptElement>(
        'script[src*="widget.js"][data-room],script[src*="widget.js"][data-project]',
      );

const STYLES = `
:host {
  all: initial !important;
  position: fixed !important;
  inset: auto !important;
  bottom: 20px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  overflow: visible !important;
  z-index: 2147483647 !important;
  display: block !important;
}
:host([data-side="right"]) { right: 20px !important; }
:host([data-side="left"]) { left: 20px !important; }
button {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 36px;
  padding: 0 14px 0 12px;
  border-radius: 10px;
  font: 500 13px/1 -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  letter-spacing: -0.01em;
  color: #fafafa;
  background: #171717;
  box-shadow: inset 0 0 0 1px #ffffff14, 0 1px 2px #00000033, 0 4px 10px -4px #00000040;
  cursor: pointer;
  transition: background-color 150ms ease-out, color 150ms ease-out;
  -webkit-font-smoothing: antialiased;
}
button:hover { background: #2b2b2b; }
button[aria-pressed="true"] { color: #171717; background: #fafafa; box-shadow: inset 0 0 0 1px #00000024, 0 1px 2px #00000026; }
button[aria-pressed="true"]:hover { background: #ececec; }
button[aria-busy="true"] { cursor: progress; color: #a3a3a3; }
button:focus-visible { outline: 2px solid #0070f7; outline-offset: 2px; }
svg { flex: none; }
`;

/** A pin with its tail down-left: the shape a placed comment takes on the page. */
const PIN =
  '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 12V6.5A4.5 4.5 0 1 1 6.5 11H3a1 1 0 0 0-1 1Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

type Target = { kind: 'room' | 'project'; id: string };
type AppModule = { start: typeof start };

const isAppModule = (m: unknown): m is AppModule =>
  typeof m === 'object' && m !== null && 'start' in m && typeof m.start === 'function';

function boot(el: HTMLScriptElement) {
  const root = document.documentElement;
  // A second copy of the snippet, or the same page loading it twice.
  if (root.dataset.marklayerWidget) return;

  const room = el.dataset.room?.trim();
  const project = el.dataset.project?.trim();
  const target: Target | null = room ? { kind: 'room', id: room } : project ? { kind: 'project', id: project } : null;
  if (!target) return;

  const origin = new URL(el.src).origin;
  // The page is being shown through MarkLayer's own viewer, which already has the tools.
  if (location.origin === origin) return;
  root.dataset.marklayerWidget = '1';

  const host = document.createElement('marklayer-feedback');
  host.dataset.side = el.dataset.position === 'bottom-left' ? 'left' : 'right';
  const shadow = host.attachShadow({ mode: 'closed' });
  adoptStyles({ root: shadow, css: STYLES });
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-pressed', 'false');
  const label = document.createElement('span');
  label.textContent = 'Feedback';
  button.innerHTML = PIN;
  button.append(label);
  shadow.append(button);

  const raise = () => {
    if (!('popover' in host)) return;
    try {
      if (host.matches(':popover-open')) host.hidePopover();
      host.showPopover();
    } catch {
      // No popover support: the fixed position and z-index still apply.
    }
  };
  if ('popover' in host) host.popover = 'manual';
  root.append(host);
  raise();

  const shareLink = () => {
    const link = new URL(`/${target.kind === 'project' ? 'p' : 's'}/${encodeURIComponent(target.id)}`, origin);
    link.searchParams.set('ref', 'widget');
    return link.href;
  };

  /** The room to join on this page, or null when the snippet's room was made somewhere else. */
  let resolving: Promise<string | null> | null = null;
  const resolve = () => {
    resolving ??= (async () => {
      try {
        const id = encodeURIComponent(target.id);
        const path = target.kind === 'project' ? `/api/p/${id}` : `/api/${id}`;
        const res = await fetch(new URL(path, origin), { credentials: 'omit' });
        if (!res.ok) return null;
        const body: unknown = await res.json();
        return target.kind === 'project'
          ? projectPageForPage({ body, href: location.href })
          : roomForPage({ id: target.id, body, href: location.href });
      } catch {
        // A network blip is not an answer: let the next hover or click ask again.
        resolving = null;
        return null;
      }
    })();
    return resolving;
  };
  // Warm the lookup before the click lands, so a fallback tab opens inside the click's user activation.
  button.addEventListener('pointerenter', resolve, { once: true });
  button.addEventListener('focus', resolve, { once: true });

  let controller: WidgetController | null = null;
  let mode: 'idle' | 'loading' | 'ready' | 'link' = 'idle';

  const openLink = () => window.open(shareLink(), '_blank', 'noopener');

  const mount = async (roomId: string): Promise<WidgetController | null> => {
    try {
      const mod: unknown = await import(new URL(__WIDGET_APP__, origin).href);
      if (!isAppModule(mod)) return null;
      return await mod.start({
        roomId,
        onCommentingChange: (on) => {
          button.setAttribute('aria-pressed', String(on));
          label.textContent = on ? 'Done' : 'Feedback';
        },
      });
    } catch {
      return null;
    }
  };

  button.addEventListener('click', async () => {
    if (mode === 'ready') return controller?.toggle();
    if (mode === 'link') return openLink();
    if (mode === 'loading') return;
    mode = 'loading';
    button.setAttribute('aria-busy', 'true');
    const roomId = await resolve();
    controller = roomId ? await mount(roomId) : null;
    button.removeAttribute('aria-busy');
    if (!controller) {
      mode = 'link';
      openLink();
      return;
    }
    mode = 'ready';
    // The overlay entered the top layer after us; step back above it so this button stays clickable.
    raise();
    controller.toggle();
  });
}

if (script) boot(script);
