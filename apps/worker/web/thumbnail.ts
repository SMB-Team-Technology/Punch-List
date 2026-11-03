import { shootFrame } from './frameShot';

const WIDTH = 640;
/** The card's own 16:10 frame, so the image fills it without a crop the reader would notice. */
export const THUMBNAIL_ASPECT = 10 / 16;
/** A dashboard card does not need a fresher picture than this; every open re-uploading would. */
const REFRESH_MS = 12 * 60 * 60 * 1000;

function storageKey(id: string): string {
  return `marklayer:thumb:${id}`;
}

export function capturedRecently(id: string): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(storageKey(id)) ?? 0) < REFRESH_MS;
  } catch {
    return false;
  }
}

export function noteCaptured(id: string): void {
  try {
    localStorage.setItem(storageKey(id), String(Date.now()));
  } catch {
    // Storage blocked: the next open captures again, which costs one small upload.
  }
}

/** Shoots the top of a same-origin frame and stores it as the dashboard card for `id`. True once it is saved. */
export async function captureAndUpload({ frame, id }: { frame: HTMLIFrameElement; id: string }): Promise<boolean> {
  const width = frame.contentDocument?.documentElement.clientWidth ?? 0;
  if (width === 0) return false;
  const bitmap = await shootFrame({
    frame,
    crop: { x: 0, y: 0, width, height: Math.round(width * THUMBNAIL_ASPECT) },
  });
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = Math.round(WIDTH * THUMBNAIL_ASPECT);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  // JPEG, not WebP: Safari cannot encode WebP from a canvas and would hand back a PNG ten times the size.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) return false;
  const res = await fetch(`/auth/links/${encodeURIComponent(id)}/thumbnail`, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  if (!res.ok) return false;
  noteCaptured(id);
  return true;
}
