import { isSettled, resolveOpStatus } from '@marklayer/types/ops';
import type { CommentStatus } from './types';

export { resolveOpStatus as getCommentStatus };

/**
 * Visual styling for a comment status badge.
 * Used by both the extension and the web viewer pins.
 */
export const STATUS_STYLES: Record<CommentStatus, { color: string; bg: string; ring: string; pinOpacity: number }> = {
  open: { color: 'transparent', bg: 'transparent', ring: 'transparent', pinOpacity: 1 },
  in_progress: {
    color: 'oklch(0.7 0.16 60)',
    bg: 'oklch(0.7 0.16 60)',
    ring: 'oklch(1 0 0 / 0.8)',
    pinOpacity: 1,
  },
  resolved: {
    color: 'oklch(0.7 0.18 145)',
    bg: 'oklch(0.7 0.18 145)',
    ring: 'oklch(1 0 0 / 0.8)',
    pinOpacity: 1,
  },
  // A deeper green than resolved, not a new hue: approved is the same journey one
  // step further on. It also has to stay legible on a pin painted the brand violet,
  // which is what the default pin colour is.
  approved: {
    color: 'var(--ds-green-900)',
    bg: 'var(--ds-green-900)',
    ring: 'oklch(1 0 0 / 0.8)',
    pinOpacity: 1,
  },
  dismissed: {
    color: 'oklch(0.6 0 0)',
    bg: 'oklch(0.6 0 0)',
    ring: 'oklch(1 0 0 / 0.6)',
    pinOpacity: 0.55,
  },
};

/** The pin itself, in brand colours: green while there is work to do, navy once it is done. */
export const pinTone = (status: CommentStatus): { bg: string; fg: string } =>
  isSettled(status) ? { bg: '#003a59', fg: '#fff' } : { bg: '#69cd2b', fg: '#003a59' };

export const STATUS_LABELS: Record<CommentStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
  approved: 'Approved',
  dismissed: 'Dismissed',
};

/**
 * The hue a status carries in flat UI chrome — the dot beside a label, a board
 * column head. Separate from STATUS_STYLES, which paints a pin over somebody
 * else's page and so needs a ring and an opacity as well.
 */
export const STATUS_COLORS: Record<CommentStatus, string> = {
  open: 'var(--ds-blue-800)',
  in_progress: 'var(--ds-amber-700)',
  resolved: 'var(--ds-green-700)',
  approved: 'var(--ds-green-900)',
  dismissed: 'var(--ds-gray-700)',
};
