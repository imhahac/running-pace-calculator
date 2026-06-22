import test from 'node:test';
import assert from 'node:assert/strict';

import Calculator from '../src/modules/core/Calculator.js';

const focus = { base: 'base', build: 'build', peak: 'peak', taper: 'taper', race: 'race' };
const workout = { easy: 'easy', tempo: 'tempo', interval: 'interval', race: 'race' };
const tr = (k: string): string => k;
const NOW = new Date('2026-01-01T00:00:00Z');
const DATE = '2026-12-01';

test('config.weeks overrides the plan length', () => {
  const plan = Calculator.generateTrainingCycle(300, DATE, focus, workout, 42195, false, tr, NOW, {
    weeks: 12
  });
  assert.equal(plan.length, 12);
});

test('start/peak volume drives a ramp from week 1 upward', () => {
  const plan = Calculator.generateTrainingCycle(300, DATE, focus, workout, 42195, false, tr, NOW, {
    weeks: 16,
    startVolumeKm: 30,
    peakVolumeKm: 80
  });
  const wk1 = plan[0].totalMileageKm;
  const wkMid = plan[10].totalMileageKm;
  assert.equal(wk1, 30); // week 1, base phase → starts at start volume
  assert.ok(wkMid > wk1, 'volume ramps up'); // later build week carries more
  assert.ok(wkMid <= 80, 'never exceeds peak');
});

test('config is opt-in: omitting it keeps the original date-derived behavior', () => {
  const without = Calculator.generateTrainingCycle(
    300,
    DATE,
    focus,
    workout,
    42195,
    false,
    tr,
    NOW
  );
  // 2026-01-01 → 2026-12-01 is ~48 weeks, capped at 24
  assert.equal(without.length, 24);
  // and a known baseline mileage shape is preserved (week 1 is the heuristic baseline)
  assert.ok(without[0].totalMileageKm > 0);
});
