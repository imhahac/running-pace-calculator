import test from 'node:test';
import assert from 'node:assert/strict';

import HeartRateCalculator from '../src/modules/core/HeartRateCalculator.js';

test('maxHr: Tanaka, Gellish and Fox formulas', () => {
  assert.equal(HeartRateCalculator.maxHr(30, 'tanaka'), 187); // 208 - 0.7*30
  assert.equal(HeartRateCalculator.maxHr(30, 'gellish'), 186); // 207 - 0.7*30
  assert.equal(HeartRateCalculator.maxHr(30, 'fox'), 190); // 220 - 30
  assert.equal(HeartRateCalculator.maxHr(0), 0);
});

test('maxHrAll returns all three formulas for comparison', () => {
  const all = HeartRateCalculator.maxHrAll(40);
  assert.equal(all.tanaka, 180); // 208 - 28
  assert.equal(all.gellish, 179); // 207 - 28
  assert.equal(all.fox, 180); // 220 - 40
});

test('karvonenZones: 5 contiguous zones in bpm', () => {
  const zones = HeartRateCalculator.karvonenZones(187, 50); // reserve 137
  assert.equal(zones.length, 5);
  // easy lower bound ≈ 0.65*137 + 50 = 139
  assert.ok(Math.abs(zones[0].loBpm - 139) <= 1);
  // repetition upper bound = max HR
  assert.equal(zones[4].hiBpm, 187);
  // contiguous: each zone's upper bpm equals the next zone's lower bpm
  for (let i = 0; i < zones.length - 1; i += 1) {
    assert.equal(zones[i].hiBpm, zones[i + 1].loBpm);
  }
  // ascending intensity
  assert.ok(zones[0].loBpm < zones[4].loBpm);
});

test('karvonenZones rejects invalid input', () => {
  assert.deepEqual(HeartRateCalculator.karvonenZones(0, 50), []);
  assert.deepEqual(HeartRateCalculator.karvonenZones(150, 160), []); // max <= rest
});

test('estimateVo2max from HR ratio (Uth–Sørensen)', () => {
  const vo2 = HeartRateCalculator.estimateVo2max(187, 50);
  assert.ok(Math.abs(vo2 - 15.3 * (187 / 50)) < 1e-9);
  assert.ok(vo2 > 50 && vo2 < 60);
});
