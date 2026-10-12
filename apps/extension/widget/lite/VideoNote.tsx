import { useComputed, useSignal } from '@preact/signals';
import type * as Real from '../../components/VideoNote';
import type { RecorderStatus } from '../../lib/recorder';

// Widget stand-in: visitors never record a clip, so the recorder and its Base UI menu stay out.

export const canRecordScreen: typeof Real.canRecordScreen = () => false;

export const useVideoNote: typeof Real.useVideoNote = () => ({
  status: useSignal<RecorderStatus>('idle'),
  id: useSignal<string | null>(null),
  elapsed: useSignal(0),
  blocked: useComputed(() => false),
  live: useSignal<MediaStream | null>(null),
  clip: useSignal<string | null>(null),
  source: useSignal<Real.VideoSource>('camera'),
  start: async () => {},
  record: async () => {},
  stop: () => {},
  clear: () => {},
});

export const VideoButton: typeof Real.VideoButton = () => <></>;
export const VideoDraft: typeof Real.VideoDraft = () => null;
export const VideoLive: typeof Real.VideoLive = () => null;
