/**
 * A DOM for `bun test`. Almost everything in `lib/` reads the document —
 * `state.ts` touches `location.href` at import time, so the globals have to
 * exist before any module under test is loaded, which is what a preload is for.
 */
import { mock } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import * as compat from 'preact/compat';
import * as jsxRuntime from 'preact/jsx-runtime';

GlobalRegistrator.register({ url: 'https://example.com/page' });

// Vite aliases React to preact/compat for the bundles; bun test has no alias, and Base UI
// imports React. Mocked here rather than per file: whichever test file first loads Base UI
// fixes which React every later file gets.
const baseUi = Bun.resolveSync('@base-ui/react', import.meta.dir);
const fromBaseUi = (id: string) => Bun.resolveSync(id, baseUi);
mock.module(fromBaseUi('react'), () => compat);
mock.module(fromBaseUi('react-dom'), () => compat);
mock.module(fromBaseUi('react/jsx-runtime'), () => jsxRuntime);
