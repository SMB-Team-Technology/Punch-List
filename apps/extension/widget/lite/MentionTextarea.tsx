import type * as Real from '../../components/MentionTextarea';

// Widget stand-in: a visitor has no roster to tag, so the field is a plain textarea
// and Base UI's Popover stays out of the bundle. `mentions()` is undefined, as with no tags.

export const useMentions: typeof Real.useMentions = () => ({
  mentionProps: { onMentionsChange: () => {} },
  mentions: () => undefined,
});

export const MentionTextarea: typeof Real.MentionTextarea = ({ taRef, onMentionsChange: _, ...rest }) => (
  <textarea ref={taRef} {...rest} />
);
