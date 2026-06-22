import test from 'node:test';
import assert from 'node:assert/strict';

import TriathlonCalculator from '../src/modules/core/TriathlonCalculator.js';

test('calculateFromPaces sums segments and transitions for 51.5', () => {
  const r = TriathlonCalculator.calculateFromPaces(51.5, {
    swimPacePer100m: 120, // 2:00 /100m
    t1: 60,
    bikeKmh: 30,
    t2: 30,
    runPacePerKm: 300 // 5:00 /km
  });

  // swim: 120 * (1.5km * 10) = 120 * 15 = 1800
  assert.equal(r.swimTime, 1800);
  // bike: 40 / 30 * 3600 = 4800
  assert.ok(Math.abs(r.bikeTime - 4800) < 1e-9);
  // run: 300 * 10 = 3000
  assert.equal(r.runTime, 3000);
  // total = 1800 + 60 + 4800 + 30 + 3000
  assert.equal(r.totalTime, 1800 + 60 + 4800 + 30 + 3000);
});

test('calculateFromPaces handles zero bike speed without dividing by zero', () => {
  const r = TriathlonCalculator.calculateFromPaces(113, {
    swimPacePer100m: 100,
    t1: 0,
    bikeKmh: 0,
    t2: 0,
    runPacePerKm: 300
  });
  assert.equal(r.bikeTime, 0);
  assert.ok(Number.isFinite(r.totalTime));
});

test('calculateFromTargetTime is the inverse of calculateFromPaces (total preserved)', () => {
  const target = 9000; // 2:30:00 for an olympic-ish target
  const inputs = TriathlonCalculator.calculateFromTargetTime(51.5, target);
  const result = TriathlonCalculator.calculateFromPaces(51.5, inputs);
  assert.ok(Math.abs(result.totalTime - target) < 1e-6);
});

test('calculateFromTargetTime uses distance-specific ratios for 226', () => {
  const target = 36000; // 10h
  const inputs = TriathlonCalculator.calculateFromTargetTime(226, target);
  // run ratio for 226 is 0.35 -> runTime 12600 over 42.2km
  assert.ok(Math.abs(inputs.runPacePerKm - (target * 0.35) / 42.2) < 1e-6);
  assert.ok(inputs.bikeKmh > 0);
});
