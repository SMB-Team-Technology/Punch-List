import { describe, expect, mock, test } from 'bun:test';
import { pinCrop, snapshotPin } from './pin-shot';

const viewport = { x: 0, y: 1000, width: 1280, height: 720 };

describe('pinCrop', () => {
  // The shot is only of what the author could see: a box past the edge would show page they never looked at.
  test('slides the box inside the visible area at an edge, keeping the pin in it', () => {
    const pin = { x: 1270, y: 1005 };
    const crop = pinCrop({ pin, viewport });
    expect(crop.x + crop.width).toBe(viewport.x + viewport.width);
    expect(crop.y).toBe(viewport.y);
    expect(pin.x).toBeGreaterThanOrEqual(crop.x);
    expect(pin.y).toBeLessThanOrEqual(crop.y + crop.height);
  });

  test('never asks for more than the viewport holds', () => {
    const crop = pinCrop({ pin: { x: 150, y: 1200 }, viewport: { x: 0, y: 1000, width: 375, height: 300 } });
    expect(crop).toEqual({ x: 0, y: 1000, width: 375, height: 300 });
  });
});

// The composer holds Post while this is pending, so it must always settle, and never throw.
describe('snapshotPin', () => {
  const base = { pin: { x: 10, y: 1010 }, viewport, color: '#f43f5e' };

  test('settles to no screenshot when the capture fails, uploading nothing', async () => {
    const upload = mock(async () => 'id');
    const shot = snapshotPin({ ...base, upload, shoot: () => Promise.reject(new Error('no capture')) });
    expect(await shot).toBeNull();
    expect(upload).not.toHaveBeenCalled();
  });

  test('gives up on a capture that never answers', async () => {
    const shot = snapshotPin({ ...base, upload: async () => 'id', shoot: () => new Promise(() => {}), timeoutMs: 5 });
    expect(await shot).toBeNull();
  });
});
