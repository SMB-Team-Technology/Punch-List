import { describe, expect, test } from 'bun:test';
import { relayTarget } from './posthog-relay';

const target = (path: string, host?: string) =>
  relayTarget({ url: new URL(`https://marklayer.app${path}`), host }).href;

describe('relayTarget', () => {
  // A wrong host here 404s the lazily loaded recorder, so replays stop with no error anywhere.
  test('sends lazy bundles and remote config to the assets host', () => {
    expect(target('/_r/static/recorder.js?v=1')).toBe('https://us-assets.i.posthog.com/static/recorder.js?v=1');
    expect(target('/_r/array/phc_x/config.js', 'https://eu.i.posthog.com')).toBe(
      'https://eu-assets.i.posthog.com/array/phc_x/config.js',
    );
  });

  test('sends events to the api host with the query intact', () => {
    expect(target('/_r/e/?compression=gzip-js&ver=1')).toBe('https://us.i.posthog.com/e/?compression=gzip-js&ver=1');
  });

  test('leaves a self-hosted instance on its own host', () => {
    expect(target('/_r/static/array.js', 'https://ph.example.com')).toBe('https://ph.example.com/static/array.js');
  });
});
