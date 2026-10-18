/**
 * The Punch List mark: a check in a rounded tile, in a 512 box.
 *
 * One definition because two renderers draw it — the app's own `Logo` and the
 * server-rendered OG cards — and a mark that differs between the product and its
 * share preview is the kind of drift nobody looks at until it is embarrassing.
 *
 * (apps/site keeps its own copy in Logo.astro: it is a separate build with no
 * dependency on this workspace. Change one, change the other.)
 */
export const MARK_TILE_RADIUS = 112;
export const MARK_CHECK = 'M144 266 L222 344 L370 178';
export const MARK_CHECK_WIDTH = 60;

/** SMB Team's palette, as smbteam.com sets it. Green means open, navy means done. */
export const BRAND = {
  navy: '#003a59',
  green: '#69cd2b',
  blue: '#0091c9',
  pale: '#f1f6f9',
} as const;

/** The OG cards' highlight: the pen stroke and the pin on the page card. */
export const MARK_ACCENT = BRAND.green;
