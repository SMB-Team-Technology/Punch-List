import { type Signal, useComputed, useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { toast } from './toasts';

export type RecorderKind = 'voice' | 'video';
export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'working';

/** The composer's single recording claim: voice and video both want the microphone. */
export type RecorderSlot = Signal<RecorderKind | null>;

/** The tracks to record, plus a track whose end (a screen's "Stop sharing") stops the recording. */
export interface OpenedStream {
  stream: MediaStream;
  ended?: MediaStreamTrack;
}

interface RecorderOptions {
  kind: RecorderKind;
  slot?: RecorderSlot;
  mimeTypes: readonly string[];
  maxSeconds: number;
  bitrates?: Pick<MediaRecorderOptions, 'audioBitsPerSecond' | 'videoBitsPerSecond'>;
  upload: (file: Blob) => Promise<string | null>;
  /** Runs once the upload has an id, while the control still shows as working. */
  onUploaded?: (id: string) => Promise<void>;
}

/** One composer's recording: idle, opening the device, recording, then uploading, ending in an upload id. */
export function useRecorder({ kind, slot, mimeTypes, maxSeconds, bitrates, upload, onUploaded }: RecorderOptions) {
  const ownSlot = useSignal<RecorderKind | null>(null);
  const claim = slot ?? ownSlot;
  const status = useSignal<RecorderStatus>('idle');
  const id = useSignal<string | null>(null);
  const elapsed = useSignal(0);
  /** The tracks being recorded, for a live preview; null outside a recording. */
  const live = useSignal<MediaStream | null>(null);
  /** The finished take as a local object URL, so it plays back before the upload lands. */
  const clip = useSignal<string | null>(null);
  const blocked = useComputed(() => claim.value !== null && claim.value !== kind);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const closed = useRef(false);

  const setStatus = (next: RecorderStatus) => {
    status.value = next;
    if (next !== 'idle') claim.value = kind;
    else if (claim.value === kind) claim.value = null;
  };

  const release = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    for (const track of stream.current?.getTracks() ?? []) track.stop();
    stream.current = null;
    live.value = null;
  };

  const dropClip = () => {
    if (clip.value) URL.revokeObjectURL(clip.value);
    clip.value = null;
  };

  const finish = async (blob: Blob) => {
    setStatus('working');
    dropClip();
    clip.value = URL.createObjectURL(blob);
    const uploaded = await upload(blob);
    if (closed.current) return;
    if (!uploaded) {
      toast('Could not save the recording');
      dropClip();
      setStatus('idle');
      return;
    }
    id.value = uploaded;
    await onUploaded?.(uploaded);
    if (!closed.current) setStatus('idle');
  };

  const stop = () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const start = async (open: () => Promise<OpenedStream | null>) => {
    // Claimed before the await: a second press during the permission prompt must not open a second stream.
    if (status.value !== 'idle' || claim.value !== null) return;
    setStatus('starting');
    const opened = await open();
    // The composer may have closed while a prompt was up; nothing may keep the device lit.
    if (closed.current) {
      for (const track of opened?.stream.getTracks() ?? []) track.stop();
      return;
    }
    if (!opened) {
      setStatus('idle');
      return;
    }
    stream.current = opened.stream;
    const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const chunks: Blob[] = [];
    let rec: MediaRecorder;
    // Both can throw (no supported type, a track that ended at the picker), and the tracks are already live.
    try {
      rec = new MediaRecorder(opened.stream, { mimeType, ...bitrates });
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        release();
        recorder.current = null;
        if (closed.current) return;
        void finish(new Blob(chunks, { type: rec.mimeType }));
      };
      rec.start();
    } catch {
      release();
      setStatus('idle');
      toast('Recording unavailable');
      return;
    }
    opened.ended?.addEventListener('ended', stop);
    recorder.current = rec;
    const startedAt = Date.now();
    elapsed.value = 0;
    live.value = opened.stream;
    setStatus('recording');
    timer.current = setInterval(() => {
      elapsed.value = Math.floor((Date.now() - startedAt) / 1000);
      if (elapsed.value >= maxSeconds) stop();
    }, 250);
  };

  // Closing the composer mid-recording must release the device, not leave the tab's indicator lit.
  useEffect(
    () => () => {
      closed.current = true;
      stop();
      release();
      dropClip();
    },
    [],
  );

  return {
    status,
    id,
    elapsed,
    blocked,
    live,
    clip,
    start,
    stop,
    clear: () => {
      id.value = null;
      dropClip();
    },
  };
}

export type Recorder = ReturnType<typeof useRecorder>;
