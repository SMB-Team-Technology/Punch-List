/** Stands in for lib/origin.ts in the widget build: the bundle talks to whichever origin served it, so a dev worker works unchanged. */
export const APP_ORIGIN = new URL(import.meta.url).origin;
