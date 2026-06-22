import test from 'node:test';
import assert from 'node:assert/strict';

import RacePlanBuilder from '../src/modules/core/RacePlanBuilder.js';

test('even split: rows cover the distance and total equals target', () => {
  const target = 3.5 * 3600; // 3:30:00
  const plan = RacePlanBuilder.build(42195, target, 'even');
  assert.equal(plan.rows.length, 43); // 42 full km + final 0.195
  const last = plan.rows[plan.rows.length - 1];
  assert.ok(Math.abs(last.cumulativeSec - target) < 1);
  // even → all per-km paces equal the average
  assert.ok(Math.abs(plan.rows[0].paceSec - plan.avgPaceSec) < 0.5);
  assert.ok(Math.abs(plan.rows[10].paceSec - plan.avgPaceSec) < 0.5);
  assert.ok(plan.avgSpeedKmh > 11 && plan.avgSpeedKmh < 13);
  assert.ok(plan.vdot > 0);
});

test('negative split: starts slower, finishes faster, same total', () => {
  const target = 50 * 60; // 50:00 10K
  const plan = RacePlanBuilder.build(10000, target, 'negative');
  const first = plan.rows[0];
  const last = plan.rows[plan.rows.length - 1];
  assert.ok(first.paceSec > last.paceSec, 'first km slower than last');
  assert.ok(Math.abs(last.cumulativeSec - target) < 1);
});

test('positive split: starts faster than it finishes', () => {
  const plan = RacePlanBuilder.build(10000, 50 * 60, 'positive');
  assert.ok(plan.rows[0].paceSec < plan.rows[plan.rows.length - 1].paceSec);
});

test('invalid input → empty plan', () => {
  const plan = RacePlanBuilder.build(0, 1000);
  assert.deepEqual(plan.rows, []);
  assert.equal(plan.vdot, 0);
});
