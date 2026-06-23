import test from 'node:test';
import assert from 'node:assert/strict';

import SweatRateCalculator from '../src/modules/core/SweatRateCalculator.js';

test('sweatRateLh: ~1 L/h at 10 km/h in cool air', () => {
  const s = SweatRateCalculator.sweatRateLh(70, 360, 15, 50); // 6:00/km
  assert.ok(Math.abs(s - 1.0) < 0.1);
});

test('sweatRateLh: hot + humid raises losses', () => {
  const cool = SweatRateCalculator.sweatRateLh(70, 360, 15, 50);
  const hot = SweatRateCalculator.sweatRateLh(70, 360, 32, 75);
  assert.ok(hot > cool);
  assert.ok(hot > 1.4);
});

test('plan: derives fluid/sodium/carb rates and stations', () => {
  const p = SweatRateCalculator.plan(70, 360, 30, 15, 50);
  assert.ok(Math.abs(p.fluidRateMlh - 750) < 40); // ~75% of ~1 L/h
  assert.ok(Math.abs(p.sodiumRateMgh - 1000) < 60); // ~1 g/L
  assert.equal(p.carbRateGh, 90); // 30 km @ 6:00 = 180 min
  assert.ok(p.stations.length > 0);
  assert.ok(p.stations.every((st) => st.fluidMl >= 0 && st.sodiumMg >= 0));
});

test('sweatRateLh rejects invalid input', () => {
  assert.equal(SweatRateCalculator.sweatRateLh(0, 360, 20, 50), 0);
});
