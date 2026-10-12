import { geist } from '@ext/lib/geist';
import { color, lineWidth } from '@ext/lib/state';
import type { DeviceMode } from '@ext/lib/types';
import { cn } from '@marklayer/types';
import { Check, Copy, Loader2, Monitor, Smartphone, Tablet } from 'lucide-preact';
import { useEffect, useRef } from 'preact/hooks';
import { siGithub } from 'simple-icons';
import { MARK_PATHS, MARK_TRANSFORM } from '../src/brand';

/** One glyph per viewport, so the switcher and the op badge can never disagree. */
export const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;
export const DEVICE_LABELS: Record<DeviceMode, string> = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };

/** Presence: a solid dot in a ring of its own colour, never a glow. */
export function PresenceDot({ live }: { live: boolean }) {
  return (
    <span
      class="w-1.5 h-1.5 rounded-full shrink-0"
      style={
        live
          ? {
              background: 'var(--ds-green-700)',
              boxShadow: '0 0 0 3px color-mix(in oklab, var(--ds-green-700) 20%, transparent)',
            }
          : { background: 'var(--ds-gray-700)' }
      }
    />
  );
}

export function Spinner() {
  return <Loader2 size={16} class="animate-spin" aria-hidden="true" />;
}

/**
 * Click-to-copy, confirmed in place. Both places a person meets it — a dashboard
 * row and the share card — swap the same glyph and announce through the same live
 * region, which is only visible otherwise; the caller brings the chrome that differs.
 */
export function CopyControl({
  copied,
  onClick,
  size,
  strokeWidth,
  class: className,
  disabled,
}: {
  copied: boolean;
  onClick: () => void;
  size: number;
  strokeWidth: number;
  class?: string;
  disabled?: boolean;
}) {
  // One weight across the swap: a check drawn heavier than the copy glyph it
  // replaces reads as the button changing size, not state.
  const Glyph = copied ? Check : Copy;
  return (
    <button
      type="button"
      aria-label={copied ? 'Link copied' : 'Copy link'}
      disabled={disabled}
      class={cn(
        geist.ctlIdle,
        className,
        // Holds through hover so the confirmation does not flicker back to grey
        // under a pointer that never left the button.
        copied && 'text-(--ds-green-700) hover:text-(--ds-green-700)',
      )}
      onClick={onClick}
    >
      <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true" />
      <span role="status" class="sr-only">
        {copied ? 'Link copied' : ''}
      </span>
    </button>
  );
}

let logoIdx = 0;
export function Logo({ size = 24, class: className }: { size?: number; class?: string }) {
  const id = `ml${++logoIdx}`;
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true" class={className}>
      <g transform={MARK_TRANSFORM} fill={`url(#${id})`}>
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <defs>
        <linearGradient id={id} gradientTransform="rotate(45)" style={{ transformOrigin: 'center center' }}>
          <stop stop-color="#A855F7" />
          <stop offset="1" stop-color="#6D28D9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* The box is the tap target, not a resting container: it carries no background
   until hover, and it matches the sibling icon link in the landing nav so the
   two read as one pair rather than two differently-sized glyphs. 44px under
   `sm` clears the touch-target floor; the bare 18px anchor did not. */
export const ICON_LINK_CLS =
  'inline-flex items-center justify-center size-11 sm:size-9 rounded-lg transition-colors no-underline hover:bg-current/[0.04]';

/* The landing page embeds a room in an iframe, so a bare `href="/"` loads the
   landing page inside its own screenshot. Every way out of the viewer spreads this. */
export const HOME_LINK_PROPS = { href: '/', target: '_top' } as const;

export function GithubLink({ dark }: { dark?: boolean }) {
  return (
    <a
      href="https://github.com/thevrus/MarkLayer"
      target="_blank"
      rel="noopener"
      class={`${ICON_LINK_CLS} ${
        dark ? 'text-ml-fg/60 hover:text-ml-fg' : 'text-(--ds-gray-900) hover:text-(--ds-gray-900)'
      }`}
    >
      <span class="sr-only">GitHub</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={siGithub.path} />
      </svg>
    </a>
  );
}

export function TextInputOverlay({
  x,
  y,
  scale: s,
  scrollY,
  onCommit,
}: {
  x: number;
  y: number;
  scale: number;
  scrollY: number;
  onCommit: (text: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fontSize = Math.max(14, lineWidth.value * 6);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const vx = x * s;
  const vy = y * s - scrollY;

  return (
    <textarea
      name="textAnnotation"
      ref={ref}
      class="absolute bg-transparent border-none outline-none resize-none p-0 m-0"
      style={{
        left: vx,
        top: vy,
        fontSize: `${fontSize * s}px`,
        lineHeight: 1.3,
        color: color.value,
        fontFamily: '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        minWidth: '40px',
        minHeight: `${fontSize * s * 1.3}px`,
        caretColor: color.value,
        fieldSizing: 'content',
        zIndex: 2147483646,
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onCommit(e.currentTarget.value.trim());
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCommit('');
        }
      }}
      onBlur={(e) => {
        onCommit(e.currentTarget.value.trim());
      }}
      placeholder="Type here…"
    />
  );
}
