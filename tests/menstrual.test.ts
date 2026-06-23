import test from 'node:test';
import assert from 'node:assert/strict';

import MenstrualCalculator from '../src/modules/core/MenstrualCalculator.js';

test('28-day cycle phase boundaries', () => {
  assert.equal(MenstrualCalculator.phase(3), 'menstrual');
  assert.equal(MenstrualCalculator.phase(10), 'follicular');
  assert.equal(MenstrualCalculator.phase(14), 'ovulation'); // 28 − 14 = 14
  assert.equal(MenstrualCalculator.phase(22), 'luteal');
});

test('luteal anchored 14 days before next period (shorter cycle)', () => {
  // length 24 → ovulation ~ day 10
  assert.equal(MenstrualCalculator.phase(10, 24), 'ovulation');
  assert.equal(MenstrualCalculator.phase(20, 24), 'luteal');
});

test('rejects out-of-range input', () => {
  assert.equal(MenstrualCalculator.phase(0), null);
  assert.equal(MenstrualCalculator.phase(30, 28), null);
  assert.equal(MenstrualCalculator.phase(5, 10), null); // length < 21
});
