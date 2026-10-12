import type * as Real from '../../lib/drafts';

// Widget stand-in: the ops are the room's, not a local draft, and the host site's IndexedDB
// is shared with the extension, which would otherwise restore strangers' comments as its own.
export const createDraftStore: typeof Real.createDraftStore = () => ({
  restore: async () => {},
  scheduleSave: () => {},
  clear: () => {},
});
