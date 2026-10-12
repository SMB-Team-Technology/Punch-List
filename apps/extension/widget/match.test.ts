import { describe, expect, test } from 'bun:test';
import { projectPageForPage, roomForPage, samePage } from './match';

describe('samePage', () => {
  test('ignores query, hash and a trailing slash', () => {
    expect(samePage({ a: 'https://shop.example/pricing/?utm=x#plans', b: 'https://shop.example/pricing' })).toBe(true);
  });

  test('a different path, host or scheme is a different page', () => {
    expect(samePage({ a: 'https://shop.example/pricing', b: 'https://shop.example/pricing/team' })).toBe(false);
    expect(samePage({ a: 'https://shop.example/', b: 'https://www.shop.example/' })).toBe(false);
    expect(samePage({ a: 'http://shop.example/', b: 'https://shop.example/' })).toBe(false);
  });

  test('a room without a usable URL matches nothing', () => {
    expect(samePage({ a: 'not a url', b: 'not a url' })).toBe(false);
    expect(samePage({ a: 'file:///a.html', b: 'file:///a.html' })).toBe(false);
  });
});

describe('roomForPage', () => {
  test('only resolves on the page the room was made on', () => {
    const body = { ops: [], url: 'https://shop.example/', width: 1280 };
    expect(roomForPage({ id: 'r1', body, href: 'https://shop.example/?ref=ad' })).toBe('r1');
    expect(roomForPage({ id: 'r1', body, href: 'https://shop.example/cart' })).toBeNull();
    expect(roomForPage({ id: 'r1', body: { ops: [], url: null }, href: 'https://shop.example/' })).toBeNull();
  });
});

describe('projectPageForPage', () => {
  test('picks the page whose URL is this one, skipping placeholders', () => {
    const body = {
      pageIds: ['a', 'b', 'c'],
      pages: [
        { id: 'a', ops: [], url: null, width: null },
        { id: 'b', ops: [], url: 'https://shop.example/', width: 1280 },
        { id: 'c', ops: [], url: 'https://shop.example/cart/', width: 1280 },
      ],
    };
    expect(projectPageForPage({ body, href: 'https://shop.example/cart' })).toBe('c');
    expect(projectPageForPage({ body, href: 'https://shop.example/checkout' })).toBeNull();
  });
});
