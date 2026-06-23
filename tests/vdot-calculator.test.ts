import test from 'node:test';
import assert from 'node:assert/strict';

import VdotCalculator from '../src/modules/core/VdotCalculator.js';

// Reference: a 10K in 50:00 yields VDOT ≈ 40, with Daniels paces
// E 6:07, M 5:23, T 5:05, I 4:36, R 4:11 per km (ctyeh.com / Daniels tables).

test('vdotFromRace: 10K in 50:00 ≈ VDOT 40', () => {
  const vdot = VdotCalculator.vdotFromRace(10000, 50 * 60);
  assert.ok(Math.abs(vdot - 40) < 0.3, `expected ~40, got ${vdot}`);
});

test('vdotFromRace rejects invalid input', () => {
  assert.equal(VdotCalculator.vdotFromRace(0, 1000), 0);
  assert.equal(VdotCalculator.vdotFromRace(10000, 0), 0);
  assert.equal(VdotCalculator.vdotFromRace(-1, -1), 0);
});

test('trainingPaces(40) match Daniels table within a few seconds/km', () => {
  const p = VdotCalculator.trainingPaces(40);
  const near = (actual: number, expected: number, tol = 4) =>
    assert.ok(
      Math.abs(actual - expected) <= tol,
      `expected ~${expected}s, got ${Math.round(actual)}s`
    );
  near(p.easy, 367);
  near(p.marathon, 323);
  near(p.threshold, 305);
  near(p.interval, 276);
  near(p.repetition, 251);
  // ordering: easy slowest → repetition fastest
  assert.ok(p.easy > p.marathon);
  assert.ok(p.marathon > p.threshold);
  assert.ok(p.threshold > p.interval);
  assert.ok(p.interval > p.repetition);
});

test('higher VDOT → faster paces', () => {
  const slow = VdotCalculator.trainingPaces(35);
  const fast = VdotCalculator.trainingPaces(55);
  assert.ok(fast.easy < slow.easy);
  assert.ok(fast.interval < slow.interval);
});

test('equivalentRaceTime is self-consistent and ordered by distance', () => {
  const vdot = 50;
  const t5k = VdotCalculator.equivalentRaceTime(vdot, 5000);
  const t10k = VdotCalculator.equivalentRaceTime(vdot, 10000);
  const tHalf = VdotCalculator.equivalentRaceTime(vdot, 21097.5);
  assert.ok(t5k < t10k && t10k < tHalf);
  // round-trip: time → vdot → time recovers the same VDOT
  assert.ok(Math.abs(VdotCalculator.vdotFromRace(10000, t10k) - vdot) < 0.2);
});

test('gradeFor: VDOT bands beginner→elite, monotonic by threshold', () => {
  assert.equal(VdotCalculator.gradeFor(30), 'beginner');
  assert.equal(VdotCalculator.gradeFor(37.9), 'beginner');
  assert.equal(VdotCalculator.gradeFor(38), 'recreational');
  assert.equal(VdotCalculator.gradeFor(48), 'intermediate');
  assert.equal(VdotCalculator.gradeFor(58), 'advanced');
  assert.equal(VdotCalculator.gradeFor(66), 'elite');
  assert.equal(VdotCalculator.gradeFor(80), 'elite');
});
