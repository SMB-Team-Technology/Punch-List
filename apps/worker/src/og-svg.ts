import { BRAND, MARK_CHECK, MARK_CHECK_WIDTH, MARK_TILE_RADIUS } from './brand';

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** The tile fills its whole 512 box, so the box is the artwork's extent. */
export const MARK_BOX = { x: 0, y: 0, h: 512 };

/* Two axes, and everything on either card sits on one of them: the marks (the
   logo, the favicon) hang at the outer edge, the words start at the inner one. */
export const MARK_AXIS = 72;
export const TEXT_AXIS = 132;
export const RIGHT_EDGE = 1128;

export const CARD = { width: 1200, height: 630 };

/** Display tracking, as a fraction of the size. Both cards set their large type with it. */
export const TRACKING = -0.035;

/**
 * The cards' five tones, on the brand navy. The one other colour on a card is
 * the green the page card's stroke and pin are drawn in.
 */
export const TONE = {
  ground: BRAND.navy,
  ink: '#ffffff',
  muted: '#9db7c6',
  faint: '#3d6b84',
  /** A tone barely above the ground: the watermark, an empty panel. */
  ghost: '#00476b',
};

/**
 * The tally and the colophon both read as one line in two voices, so the dot
 * between their parts is defined once.
 *
 * Non-breaking spaces: XML collapses and trims ordinary runs, so a plain ' · '
 * would render as a dot jammed between the words.
 */
export const SEPARATOR = `<tspan fill="${TONE.faint}">\u00a0\u00a0·\u00a0\u00a0</tspan>`;

/** The mark alone: the tile in `fill`, the check cut through it in the ground tone. */
export function mark({ x, top, height, fill }: { x: number; top: number; height: number; fill: string }): string {
  const k = height / MARK_BOX.h;
  return `<g transform="translate(${(x - MARK_BOX.x * k).toFixed(2)} ${(top - MARK_BOX.y * k).toFixed(2)}) scale(${k.toFixed(6)})">
    <rect width="512" height="512" rx="${MARK_TILE_RADIUS}" fill="${fill}"/>
    <path d="${MARK_CHECK}" fill="none" stroke="${TONE.ground}" stroke-width="${MARK_CHECK_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

/** The logo at the size both cards sign themselves with. */
export const SIGNATURE_MARK = { x: MARK_AXIS, top: 54, height: 54 };
