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

test('negative split is a 3-phase shape: conservative start, even middle, faster finish', () => {
  const plan = RacePlanBuilder.build(42195, 4 * 3600, 'negative'); // 4:00:00 marathon
  const avg = plan.avgPaceSec;
  const early = plan.rows[2].paceSec; // ~km 3 (first quarter)
  const middle = plan.rows[21].paceSec; // ~km 22 (middle)
  const late = plan.rows[40].paceSec; // ~km 41 (final quarter)
  assert.ok(early > middle && middle > late, 'pace eases: slow start → even middle → fast finish');
  assert.ok(Math.abs(middle - avg) / avg < 0.01, 'middle holds ≈ goal pace');
  // Still an overall (modest) negative split: second half faster than the first.
  const half = Math.floor(plan.rows.length / 2);
  const meanPace = (rows: typeof plan.rows): number =>
    rows.reduce((s, r) => s + r.paceSec, 0) / rows.length;
  assert.ok(meanPace(plan.rows.slice(half)) < meanPace(plan.rows.slice(0, half)));
});

test('invalid input → empty plan', () => {
  const plan = RacePlanBuilder.build(0, 1000);
  assert.deepEqual(plan.rows, []);
  assert.equal(plan.vdot, 0);
});
