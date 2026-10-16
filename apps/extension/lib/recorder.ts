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
  /** Also record the stream's audio alone: the server cannot cut a clip's sound out to transcribe it. */
  audioTrack?: { mimeTypes: readonly string[]; bitsPerSecond: number };
  /** Runs once the upload has an id, while the control still shows as working. `audio` is the
   *  `audioTrack` take, null when not asked for or the stream had no sound. */
  onUploaded?: (done: { id: string; audio: Blob | null }) => Promise<void>;
}

/** One composer's recording: idle, opening the device, recording, then uploading, ending in an upload id. */
export function useRecorder({
  kind,
  slot,
  mimeTypes,
  maxSeconds,
  bitrates,
  upload,
  audioTrack,
  onUploaded,
}: RecorderOptions) {
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
  const sidecar = useRef<MediaRecorder | null>(null);
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
    if (sidecar.current?.state === 'recording') sidecar.current.stop();
    sidecar.current = null;
    for (const track of stream.current?.getTracks() ?? []) track.stop();
    stream.current = null;
    live.value = null;
  };

  const dropClip = () => {
    if (clip.value) URL.revokeObjectURL(clip.value);
    clip.value = null;
  };

  /** The stream's sound on its own, resolving once stopped; null when there is none to take. */
  const recordAudioAlone = (source: MediaStream): Promise<Blob | null> => {
    const tracks = source.getAudioTracks();
    if (!audioTrack || tracks.length === 0) return Promise.resolve(null);
    try {
      const mimeType = audioTrack.mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(new MediaStream(tracks), {
        mimeType,
        audioBitsPerSecond: audioTrack.bitsPerSecond,
      });
      const chunks: Blob[] = [];
      const done = new Promise<Blob | null>((resolve) => {
        rec.ondataavailable = (e) => chunks.push(e.data);
        rec.onstop = () => resolve(chunks.length ? new Blob(chunks, { type: rec.mimeType }) : null);
        rec.onerror = () => resolve(null);
      });
      rec.start();
      sidecar.current = rec;
      return done;
    } catch {
      // The transcript is a bonus; the clip still records without it.
      return Promise.resolve(null);
    }
  };

  const finish = async ({ blob, audio }: { blob: Blob; audio: Promise<Blob | null> }) => {
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
    await onUploaded?.({ id: uploaded, audio: await audio });
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
    let audio: Promise<Blob | null> = Promise.resolve(null);
    let rec: MediaRecorder;
    // Both can throw (no supported type, a track that ended at the picker), and the tracks are already live.
    try {
      rec = new MediaRecorder(opened.stream, { mimeType, ...bitrates });
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        release();
        recorder.current = null;
        if (closed.current) return;
        void finish({ blob: new Blob(chunks, { type: rec.mimeType }), audio });
      };
      rec.start();
      audio = recordAudioAlone(opened.stream);
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
