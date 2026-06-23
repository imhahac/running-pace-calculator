import test from 'node:test';
import assert from 'node:assert/strict';

import StridesBuilder from '../src/modules/core/StridesBuilder.js';

test('session: week 1 is the gentlest dose', () => {
  const s = StridesBuilder.session(1);
  assert.deepEqual(s, { week: 1, reps: 4, durationSec: 15, recoverySec: 45 });
});

test('session: week 12 reaches the peak dose', () => {
  const s = StridesBuilder.session(12);
  assert.deepEqual(s, { week: 12, reps: 8, durationSec: 30, recoverySec: 90 });
});

test('session clamps out-of-range weeks', () => {
  assert.equal(StridesBuilder.session(0).week, 1);
  assert.equal(StridesBuilder.session(99).week, 12);
});

test('progression spans 12 non-decreasing weeks', () => {
  const p = StridesBuilder.progression();
  assert.equal(p.length, 12);
  for (let i = 1; i < p.length; i += 1) {
    assert.ok(p[i].reps >= p[i - 1].reps);
    assert.ok(p[i].durationSec >= p[i - 1].durationSec);
  }
});
