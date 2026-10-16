import { createContext } from 'preact';
import { useContext, useState } from 'preact/hooks';

/**
 * A menu or picker inside a hover card portals out of it, so the pointer leaving
 * for the popup would drop `:hover` and dismiss the card. The card provides this
 * and every popup under it reports open/close here, however deep it sits, so a
 * new popup never threads a callback through the components between.
 */
const HoldContext = createContext<((open: boolean) => void) | undefined>(undefined);

export const CardHold = HoldContext.Provider;

/** The hosting card's hold, or undefined where nothing is held (the annotation panel). */
export const useCardHold = () => useContext(HoldContext);

/**
 * The card side: the latch every popup under it reports to, and the three class
 * fragments that keep the card at its hovered state while one is out. A pin
 * wraps its root in `<CardHold value={hold.report}>`.
 */
export function useHoldLatch() {
  // A count, not a flag: the triage menus, reaction pickers and the screenshot
  // lightbox share this latch, and one closing must not drop a card another holds.
  const [opened, setOpened] = useState(0);
  const open = opened > 0;
  return {
    report: (next: boolean) => setOpened((n) => Math.max(0, n + (next ? 1 : -1))),
    /** Set as `data-held` on the pin, so its layer stays lifted with the pointer on the menu. */
    held: open,
    /** Keep the pin above its neighbours while a menu is out. */
    rootCls: open && 'z-50',
    /** The card is pointer-transparent until hovered; a live menu counts as hovered. */
    wrapCls: open && 'pointer-events-auto',
    /** Hold the card at its hovered transform instead of letting it animate away. */
    cardCls: open && 'opacity-100 scale-100 translate-x-0',
  };
}
