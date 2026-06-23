import test from 'node:test';
import assert from 'node:assert/strict';

import FuelingCalculator from '../src/modules/core/FuelingCalculator.js';

test('calories: ~1.036 kcal/kg/km gross', () => {
  assert.equal(FuelingCalculator.calories(70, 42.195), 3060);
  assert.equal(FuelingCalculator.calories(0, 10), 0);
});

test('carbRate tiers by duration', () => {
  assert.equal(FuelingCalculator.carbRate(50), 0);
  assert.equal(FuelingCalculator.carbRate(90), 30);
  assert.equal(FuelingCalculator.carbRate(130), 60);
  assert.equal(FuelingCalculator.carbRate(200), 90);
});

test('plan: marathon timeline ends at the finish line and fuels late', () => {
  const p = FuelingCalculator.plan(42.195, 4 * 3600, 70);
  assert.equal(p.totalKcal, 3060);
  assert.equal(p.carbRateGh, 90);
  assert.equal(p.stations.length, 9); // 5,10,…,40 + finish
  assert.equal(p.stations[p.stations.length - 1].km, 42.2);
  assert.equal(p.stations[0].carbG, 0); // first 5 km is before the 45-min mark
  assert.ok(p.totalCarbG > 0);
});

test('plan: empty for invalid input', () => {
  const p = FuelingCalculator.plan(0, 0, 70);
  assert.equal(p.stations.length, 0);
});
