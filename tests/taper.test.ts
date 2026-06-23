import test from 'node:test';
import assert from 'node:assert/strict';

import TaperCalculator from '../src/modules/core/TaperCalculator.js';

test('2-week taper cuts volume progressively to the race', () => {
  const p = TaperCalculator.plan(80, 2);
  assert.equal(p.weeks.length, 2);
  assert.deepEqual(
    p.weeks.map((w) => w.volumeKm),
    [56, 40] // 70% then 50% of 80
  );
  // race week is the lowest volume
  assert.ok(p.weeks[1].volumeKm < p.weeks[0].volumeKm);
});

test('3-week and 1-week schedules', () => {
  assert.deepEqual(
    TaperCalculator.plan(80, 3).weeks.map((w) => w.volumeKm),
    [64, 48, 36]
  );
  assert.deepEqual(
    TaperCalculator.plan(80, 1).weeks.map((w) => w.volumeKm),
    [44]
  );
});

test('taperWeeks is clamped to 1–3', () => {
  assert.equal(TaperCalculator.plan(80, 9).taperWeeks, 3);
  assert.equal(TaperCalculator.plan(80, 0).taperWeeks, 2); // 0 → default 2
});
