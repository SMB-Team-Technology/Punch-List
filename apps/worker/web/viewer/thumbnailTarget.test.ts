import { describe, expect, test } from 'bun:test';
import { thumbnailTarget } from './thumbnailTarget';

describe('thumbnailTarget', () => {
  const pages = [{ id: 'first' }, { id: 'second' }];

  test("a site's card is drawn from its first page, the row the dashboard lists", () => {
    expect(thumbnailTarget({ project: 'p1', pages, pageIdx: 0, annotation: 'first' })).toBe('first');
  });

  test('a deeper page of the site never replaces that picture', () => {
    expect(thumbnailTarget({ project: 'p1', pages, pageIdx: 1, annotation: 'second' })).toBeNull();
  });

  test('a single shared page is its own row', () => {
    expect(thumbnailTarget({ project: null, pages: [], pageIdx: 0, annotation: 'solo' })).toBe('solo');
    expect(thumbnailTarget({ project: null, pages: [], pageIdx: 0, annotation: '' })).toBeNull();
  });
});
