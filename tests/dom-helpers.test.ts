import test from 'node:test';
import assert from 'node:assert/strict';

import { num, int, setText, pickOption } from '../src/modules/ui/controllers/dom.js';

test('pickOption constrains a raw value to the allowed set', () => {
  const allowed = ['a', 'b', 'c'] as const;
  assert.equal(pickOption('b', allowed, 'a'), 'b');
  assert.equal(pickOption('x', allowed, 'a'), 'a'); // unknown → fallback
  assert.equal(pickOption(undefined, allowed, 'c'), 'c');
  assert.equal(pickOption(null, allowed, 'c'), 'c');
});

test('num/int/setText operate over a minimal document stub', () => {
  const store: Record<string, { value?: string; textContent?: string }> = {
    n: { value: '12.5' },
    i: { value: '7' },
    out: { textContent: '' }
  };
  const g = globalThis as { document?: unknown };
  g.document = { getElementById: (id: string) => store[id] ?? null };
  try {
    assert.equal(num('n'), 12.5);
    assert.equal(int('i'), 7);
    assert.ok(Number.isNaN(num('missing')));
    setText('out', 'hi');
    assert.equal(store.out.textContent, 'hi');
    setText('missing', 'x'); // must not throw
  } finally {
    delete g.document;
  }
});
