/**
 * The screenshot every new comment carries: the page around its pin, as an ordinary
 * image attachment, so an integration or an agent sees what the pin points at without
 * opening the page. Taking it is best effort: any failure resolves to null and the
 * comment posts without it.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** CSS px kept around a pin: the element it names plus enough of its surroundings to place it. */
const SHOT_SIZE = { width: 800, height: 500 };
/** Holds Post for at most this long: a stalled capture or upload must not keep a comment from posting. */
const SHOT_TIMEOUT_MS = 10_000;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;
/** The pin's dot in the shot, in CSS px, so it reads the same at any device pixel ratio. */
const MARKER_RADIUS = 7;

const clamp = (n: number, lo: number, hi: number): number => Math.min(Math.max(n, lo), hi);

/**
 * The box to shoot around a pin, in the same coordinates as `pin` and `viewport`.
 * Slid rather than shrunk at an edge, so a pin near the corner sits off-centre in a
 * full-size shot instead of at the middle of a sliver.
 */
export function pinCrop({ pin, viewport }: { pin: { x: number; y: number }; viewport: Box }): Box {
  const width = Math.min(SHOT_SIZE.width, viewport.width);
  const height = Math.min(SHOT_SIZE.height, viewport.height);
  return {
    x: clamp(pin.x - width / 2, viewport.x, viewport.x + viewport.width - width),
    y: clamp(pin.y - height / 2, viewport.y, viewport.y + viewport.height - height),
    width,
    height,
  };
}

/** Downscale, draw the pin where it was placed, and re-encode as JPEG for the anonymous `/f`. */
async function encodeShot({
  image,
  crop,
  pin,
  color,
}: {
  image: ImageBitmap;
  crop: Box;
  pin: { x: number; y: number };
  color: string;
}): Promise<Blob | null> {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  image.close();

  const perCssPx = canvas.width / crop.width;
  ctx.beginPath();
  ctx.arc((pin.x - crop.x) * perCssPx, (pin.y - crop.y) * perCssPx, MARKER_RADIUS * perCssPx, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2 * perCssPx;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
}

/**
 * Shoot, mark, encode and upload the area around a pin, ending in an upload id. Never
 * rejects, and gives up after `timeoutMs`: the composer queues this like a pasted image,
 * so a hang here would otherwise hold its Post button.
 */
export function snapshotPin({
  shoot,
  pin,
  viewport,
  color,
  upload,
  timeoutMs = SHOT_TIMEOUT_MS,
}: {
  /** The pixels of `crop` with no MarkLayer UI in them, at whatever density the platform gives. */
  shoot: (crop: Box) => Promise<ImageBitmap>;
  pin: { x: number; y: number };
  /** The visible area, in `pin`'s coordinates; only what the author could see is shot. */
  viewport: Box;
  color: string;
  upload: (file: Blob) => Promise<string | null>;
  timeoutMs?: number;
}): Promise<string | null> {
  const crop = pinCrop({ pin, viewport });
  const run = async (): Promise<string | null> => {
    if (crop.width < 1 || crop.height < 1) return null;
    const image = await shoot(crop);
    const jpeg = await encodeShot({ image, crop, pin, color });
    return jpeg ? upload(jpeg) : null;
  };
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
  return Promise.race([run().catch(() => null), timeout]);
}
