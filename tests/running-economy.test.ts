import test from 'node:test';
import assert from 'node:assert/strict';

import RunningEconomyCalculator from '../src/modules/core/RunningEconomyCalculator.js';

test('vo2maxFrom5k: a 20:00 5K is ~VDOT 50', () => {
  const v = RunningEconomyCalculator.vo2maxFrom5k(20 * 60);
  assert.ok(v > 45 && v < 55);
  assert.equal(RunningEconomyCalculator.vo2maxFrom5k(0), 0);
});

test('bodyFatBand: male bands', () => {
  assert.equal(RunningEconomyCalculator.bodyFatBand('male', 4), 'essential');
  assert.equal(RunningEconomyCalculator.bodyFatBand('male', 10), 'athlete');
  assert.equal(RunningEconomyCalculator.bodyFatBand('male', 16), 'fitness');
  assert.equal(RunningEconomyCalculator.bodyFatBand('male', 30), 'high');
});

test('bodyFatBand: female bands', () => {
  assert.equal(RunningEconomyCalculator.bodyFatBand('female', 12), 'essential');
  assert.equal(RunningEconomyCalculator.bodyFatBand('female', 18), 'athlete');
  assert.equal(RunningEconomyCalculator.bodyFatBand('female', 23), 'fitness');
  assert.equal(RunningEconomyCalculator.bodyFatBand('female', 35), 'high');
});

test('bodyFatBand rejects invalid input', () => {
  assert.equal(RunningEconomyCalculator.bodyFatBand('male', 0), '');
});
