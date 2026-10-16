import { describe, expect, test } from 'bun:test';
import { TOOLS } from '@marklayer/agent-tools';
import { AGENT_TOOLS } from './agent-tools';

describe('AGENT_TOOLS', () => {
  test('names the same tools as the agent-tools contract, no more and no fewer', () => {
    const described = AGENT_TOOLS.map((t) => `marklayer_${t.name}`).sort();
    const shipped = TOOLS.map((t) => t.name).sort();
    expect(described).toEqual(shipped);
  });
});
