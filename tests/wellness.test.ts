import test from 'node:test';
import assert from 'node:assert/strict';

import WellnessCalculator from '../src/modules/core/WellnessCalculator.js';

test('all factors best → 100, four present, all good', () => {
  const r = WellnessCalculator.score({ sleep: 0, soreness: 0, stress: 0, mood: 0 });
  assert.equal(r.score, 100);
  assert.equal(r.present, 4);
  assert.ok(r.factors.every((f) => f.state === 'good'));
});

test('mixed severities average only the reported factors', () => {
  // sleep 0→100, soreness 2→30, stress 1→65, mood not reported → avg(100,30,65)=65
  const r = WellnessCalculator.score({ sleep: 0, soreness: 2, stress: 1 });
  assert.equal(r.present, 3);
  assert.equal(r.score, 65);
  assert.equal(r.factors.find((f) => f.key === 'sleep')?.state, 'good');
  assert.equal(r.factors.find((f) => f.key === 'soreness')?.state, 'bad');
  assert.equal(r.factors.find((f) => f.key === 'stress')?.state, 'ok');
  assert.equal(r.factors.find((f) => f.key === 'mood')?.state, 'na');
  assert.equal(r.factors.find((f) => f.key === 'mood')?.score, null);
});

test('nothing reported → null score, all n/a', () => {
  const r = WellnessCalculator.score({});
  assert.equal(r.score, null);
  assert.equal(r.present, 0);
  assert.ok(r.factors.every((f) => f.state === 'na'));
});

test('out-of-range / non-finite severities are treated as not reported', () => {
  const r = WellnessCalculator.score({ sleep: 5, soreness: NaN, stress: -1, mood: 2 });
  assert.equal(r.present, 1);
  assert.equal(r.score, 30); // only mood (severity 2) counts
});
