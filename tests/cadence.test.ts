import test from 'node:test';
import assert from 'node:assert/strict';

import CadenceCalculator from '../src/modules/core/CadenceCalculator.js';

test('analyze without a current cadence: band only', () => {
  const r = CadenceCalculator.analyze(300); // 5:00/km = 12 km/h
  assert.ok(r);
  assert.equal(r?.speedKmh, 12);
  assert.ok((r?.recommendedLo ?? 0) >= 160);
  assert.ok((r?.recommendedHi ?? 0) > (r?.recommendedLo ?? 0));
  assert.equal(r?.strideLengthM, null);
  assert.equal(r?.plus5, null);
  assert.equal(r?.overstriding, false);
});

test('analyze with a low current cadence flags overstriding + targets', () => {
  const r = CadenceCalculator.analyze(300, 160);
  assert.ok(r);
  assert.equal(r?.plus5, 168); // 160 × 1.05
  assert.equal(r?.plus10, 176); // 160 × 1.10
  assert.ok(Math.abs((r?.strideLengthM ?? 0) - 1.25) < 0.02);
  assert.equal(r?.overstriding, true); // 160 below the recommended band at 12 km/h
});

test('faster running recommends a higher cadence band', () => {
  const slow = CadenceCalculator.analyze(420); // 7:00/km
  const fast = CadenceCalculator.analyze(225); // 3:45/km
  assert.ok((fast?.recommendedLo ?? 0) > (slow?.recommendedLo ?? 0));
});

test('analyze rejects invalid pace', () => {
  assert.equal(CadenceCalculator.analyze(0), null);
  assert.equal(CadenceCalculator.analyze(-10), null);
});
