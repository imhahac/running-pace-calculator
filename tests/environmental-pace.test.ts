import test from 'node:test';
import assert from 'node:assert/strict';

import EnvironmentalPaceCalculator from '../src/modules/core/EnvironmentalPaceCalculator.js';

test('dewPoint: ~saturation equals air temperature', () => {
  assert.ok(Math.abs(EnvironmentalPaceCalculator.dewPoint(20, 100) - 20) < 0.5);
  // Drier air → lower dew point than the air temperature.
  assert.ok(EnvironmentalPaceCalculator.dewPoint(30, 40) < 30);
});

test('gradeFactor: flat = 1, uphill slower, downhill faster', () => {
  assert.ok(Math.abs(EnvironmentalPaceCalculator.gradeFactor(0) - 1) < 1e-9);
  assert.ok(EnvironmentalPaceCalculator.gradeFactor(10) > 1.4); // 10% up costs much more
  assert.ok(EnvironmentalPaceCalculator.gradeFactor(-10) < 1); // moderate downhill is cheaper
  // Clamped beyond the validated ±45% range (no blow-up).
  assert.ok(isFinite(EnvironmentalPaceCalculator.gradeFactor(100)));
});

test('heatSlowdownPct: cold = 0, cool ≈ 0, Taiwan-summer hot is large and capped', () => {
  assert.equal(EnvironmentalPaceCalculator.heatSlowdownPct(5, 30), 0); // WBGT ≤ 10
  assert.ok(EnvironmentalPaceCalculator.heatSlowdownPct(8, 40) < 0.5); // cool: negligible
  const hot = EnvironmentalPaceCalculator.heatSlowdownPct(32, 75);
  assert.ok(hot > 8 && hot <= 15);
});

test('risk bands from WBGT', () => {
  assert.equal(EnvironmentalPaceCalculator.risk(12), 'low');
  assert.equal(EnvironmentalPaceCalculator.risk(20), 'moderate');
  assert.equal(EnvironmentalPaceCalculator.risk(25), 'high');
  assert.equal(EnvironmentalPaceCalculator.risk(30), 'extreme');
});

test('adjust: combines heat and grade onto a base pace', () => {
  const r = EnvironmentalPaceCalculator.adjust(300, 32, 75, 5);
  assert.ok(r.adjustedPaceSec > 300); // hot + uphill is slower than base
  assert.equal(r.risk, 'extreme');
  assert.ok(r.gradeFactor > 1);
  assert.ok(r.wbgtC > 28);
  // Ideal, flat conditions leave the base pace essentially unchanged.
  const cool = EnvironmentalPaceCalculator.adjust(300, 8, 40, 0);
  assert.equal(cool.adjustedPaceSec, 300);
});

test('adjust: acclimatisation scales the heat penalty down', () => {
  const none = EnvironmentalPaceCalculator.adjust(300, 32, 75, 0, 'none');
  const partial = EnvironmentalPaceCalculator.adjust(300, 32, 75, 0, 'partial');
  const full = EnvironmentalPaceCalculator.adjust(300, 32, 75, 0, 'full');
  assert.ok(none.heatPct > full.heatPct && full.heatPct > 0);
  assert.ok(none.heatPct > partial.heatPct && partial.heatPct > full.heatPct);
  assert.ok(Math.abs(full.heatPct - none.heatPct * 0.5) < 0.2); // ~half
  assert.ok(Math.abs(partial.heatPct - none.heatPct * 0.75) < 0.2); // ~three-quarters
  // No heat penalty → acclimatisation makes no difference.
  assert.equal(EnvironmentalPaceCalculator.adjust(300, 5, 30, 0, 'full').heatPct, 0);
});

test('adjust: reverse mode is the model-consistent inverse of forward', () => {
  const fwd = EnvironmentalPaceCalculator.adjust(300, 32, 75, 5, 'none', 'forward');
  // Feeding the forward result back through reverse recovers the original pace.
  const rev = EnvironmentalPaceCalculator.adjust(fwd.adjustedPaceSec, 32, 75, 5, 'none', 'reverse');
  assert.ok(Math.abs(rev.adjustedPaceSec - 300) <= 1);
  // A pace run in the heat is "worth" a faster cool-weather pace.
  const cool = EnvironmentalPaceCalculator.adjust(330, 32, 75, 0, 'none', 'reverse');
  assert.ok(cool.adjustedPaceSec < 330);
  // Ideal flat conditions are a no-op in both directions.
  assert.equal(
    EnvironmentalPaceCalculator.adjust(300, 8, 40, 0, 'none', 'reverse').adjustedPaceSec,
    300
  );
});
