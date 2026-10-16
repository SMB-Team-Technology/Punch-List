import type * as Real from '../../components/Reactions';

// Widget stand-in: a visitor leaves feedback, not reactions, so the row and its
// picker stay out of the bundle along with Base UI's Popover.
export const Reactions: typeof Real.Reactions = () => <></>;
