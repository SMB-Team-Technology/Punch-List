import { afterEach, expect, mock, test } from 'bun:test';
import { h, render } from 'preact';

mock.module('idb-keyval', () => ({
  createStore: () => ({}),
  get: async () => undefined,
  set: async () => {},
  del: async () => {},
}));

const { useVoiceNote } = await import('../components/VoiceNote');
type VoiceNote = ReturnType<typeof useVoiceNote>;

class FakeRecorder {
  static isTypeSupported = () => true;
  mimeType = 'audio/webm';
  state = 'inactive';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.onstop?.();
  }
}
Object.defineProperty(globalThis, 'MediaRecorder', { value: FakeRecorder, configurable: true });

const host = document.createElement('div');
afterEach(() => render(null, host));

/** Mounts the hook in a throwaway component and hands back what it returned. */
function mountVoice(): VoiceNote {
  let voice: VoiceNote | undefined;
  const Probe = () => {
    voice = useVoiceNote({ upload: async () => 'up', transcribe: async () => null, onText: () => {} });
    return null;
  };
  render(h(Probe, {}), host);
  if (!voice) throw new Error('hook did not mount');
  return voice;
}

test('a second press while the mic permission is pending opens no second stream', () => {
  const getUserMedia = mock(() => new Promise<MediaStream>(() => {}));
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true });

  const voice = mountVoice();
  voice.toggle();
  voice.toggle();

  expect(getUserMedia).toHaveBeenCalledTimes(1);
});
