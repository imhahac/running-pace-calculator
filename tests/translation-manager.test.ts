import test from 'node:test';
import assert from 'node:assert/strict';

import TranslationManager from '../src/modules/state/TranslationManager.js';

test('getDict returns the live shared dictionary (no per-call copy)', () => {
  const a = TranslationManager.getDict();
  const b = TranslationManager.getDict();
  assert.equal(
    a,
    b,
    'getDict must return the same reference each call — no full-dictionary spread'
  );
  assert.equal(typeof a.tab_pace, 'string'); // a real key resolves
});

test('getAll returns an independent copy with content identical to getDict', () => {
  const copy = TranslationManager.getAll();
  const live = TranslationManager.getDict();
  assert.notEqual(copy, live, 'getAll must hand back a fresh object, not the live reference');
  assert.deepEqual(copy, live, 'getAll content must match the live dictionary');
});

test('get falls back to the key when missing; format interpolates {placeholders}', () => {
  // This fallback is why controllers keep `t.key || "…"`: a present key is
  // truthy, a missing one returns the key string (also truthy) — never empty.
  assert.equal(TranslationManager.get('__no_such_key__'), '__no_such_key__');
  assert.equal(TranslationManager.format('__x_{n}__', { n: 5 }), '__x_5__');
});
