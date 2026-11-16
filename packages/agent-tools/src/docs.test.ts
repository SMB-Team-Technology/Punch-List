import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { TOOLS } from './tools';

const read = (file: string) =>
  readFileSync(new URL(`../../../apps/site/src/content/agent/${file}`, import.meta.url), 'utf8');

/**
 * Tools each hand-written agent doc deliberately leaves out; documenting one means
 * removing it here. Punch List serves MCP over HTTP only, where
 * `marklayer_connect_room` does not exist, so llms.txt summarises the queue and
 * llms-full.txt carries the whole catalogue.
 */
const SKIPS: Record<string, string[]> = {
  'llms.txt': [
    'marklayer_connect_room',
    'marklayer_room_info',
    'marklayer_get_annotation',
    'marklayer_share_preview',
    'marklayer_set_next_steps',
    'marklayer_complete_next_step',
    'marklayer_ask',
    'marklayer_get_feedback',
  ],
  'llms-full.txt': [],
  // The skill file teaches the loop, not the whole catalogue.
  'SKILL.md': [
    'marklayer_room_info',
    'marklayer_get_annotation',
    'marklayer_share_preview',
    'marklayer_set_next_steps',
    'marklayer_complete_next_step',
    'marklayer_ask',
    'marklayer_get_feedback',
  ],
};

const names = TOOLS.map((tool) => tool.name);

describe.each(Object.keys(SKIPS))('%s', (file) => {
  const text = read(file);
  const skips = SKIPS[file] ?? [];

  test('names no tool that does not exist', () => {
    for (const [name] of text.matchAll(/marklayer_[a-z_]+/g)) expect(names).toContain(name);
  });

  test.each(names.filter((n) => !skips.includes(n)))('lists %s', (name) => {
    expect(text).toContain(name);
  });
});
