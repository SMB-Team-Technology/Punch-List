export interface EmojiEntry {
  /** GitHub shortcode, without the colons. */
  name: string;
  char: string;
  aliases?: string[];
}

/**
 * Deliberately short: this is a review tool, not a chat app. GitHub's reaction
 * set first, then the handful that review threads actually use.
 */
export const EMOJI: readonly EmojiEntry[] = [
  { name: '+1', char: '👍', aliases: ['thumbsup'] },
  { name: '-1', char: '👎', aliases: ['thumbsdown'] },
  { name: 'smile', char: '😄', aliases: ['laugh'] },
  { name: 'tada', char: '🎉', aliases: ['hooray'] },
  { name: 'confused', char: '😕' },
  { name: 'heart', char: '❤️' },
  { name: 'eyes', char: '👀' },
  { name: 'rocket', char: '🚀' },
  { name: 'thinking', char: '🤔' },
  { name: 'joy', char: '😂' },
  { name: 'cry', char: '😢' },
  { name: 'fire', char: '🔥' },
  { name: 'sparkles', char: '✨' },
  { name: '100', char: '💯' },
  { name: 'clap', char: '👏' },
  { name: 'pray', char: '🙏' },
  { name: 'wave', char: '👋' },
  { name: 'ok_hand', char: '👌' },
  { name: 'muscle', char: '💪' },
  { name: 'shrug', char: '🤷' },
  { name: 'white_check_mark', char: '✅', aliases: ['check'] },
  { name: 'x', char: '❌' },
  { name: 'warning', char: '⚠️' },
  { name: 'question', char: '❓' },
  { name: 'bulb', char: '💡', aliases: ['idea'] },
  { name: 'bug', char: '🐛' },
  { name: 'wrench', char: '🔧' },
  { name: 'art', char: '🎨' },
  { name: 'memo', char: '📝' },
  { name: 'pushpin', char: '📌' },
  { name: 'mag', char: '🔍' },
  { name: 'lock', char: '🔒' },
  { name: 'zap', char: '⚡' },
  { name: 'star', char: '⭐' },
  { name: 'coffee', char: '☕' },
  { name: 'ship', char: '🚢' },
];

const keysOf = ({ name, aliases = [] }: EmojiEntry) => [name, ...aliases];

/** Prefix hits before substring hits, table order within each; no `limit` returns every hit. */
export function matchEmoji({ query, limit = EMOJI.length }: { query: string; limit?: number }): EmojiEntry[] {
  const q = query.toLowerCase();
  if (!q) return EMOJI.slice(0, limit);
  const prefix: EmojiEntry[] = [];
  const infix: EmojiEntry[] = [];
  for (const entry of EMOJI) {
    const keys = keysOf(entry);
    if (keys.some((k) => k.startsWith(q))) prefix.push(entry);
    else if (keys.some((k) => k.includes(q))) infix.push(entry);
  }
  return [...prefix, ...infix].slice(0, limit);
}
