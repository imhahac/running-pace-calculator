import test from 'node:test';
import assert from 'node:assert/strict';

import GlycogenCalculator from '../src/modules/core/GlycogenCalculator.js';

test('modifiedSherman: 7-day schedule, ~10 g/kg load', () => {
  const p = GlycogenCalculator.plan(60, 'modifiedSherman');
  assert.equal(p.days.length, 7);
  assert.equal(p.loadGperKg, 10);
  assert.equal(p.peakCarbG, 600); // 10 × 60
  const raceDay = p.days.find((d) => d.dayOffset === 0);
  assert.equal(raceDay?.carbG, 420); // 7 × 60
  assert.ok(!p.days.some((d) => d.trainingKey === 'deplete'));
});

test('classic: includes a depletion phase', () => {
  const p = GlycogenCalculator.plan(60, 'classic');
  assert.equal(p.days.length, 7);
  assert.ok(p.days.some((d) => d.trainingKey === 'deplete'));
});

test('wa: 1-day super-compensation at ~11 g/kg', () => {
  const p = GlycogenCalculator.plan(60, 'wa');
  assert.equal(p.days.length, 4);
  assert.equal(p.loadGperKg, 11);
  assert.equal(p.peakCarbG, 660);
});

test('zero weight yields zero grams but keeps the schedule', () => {
  const p = GlycogenCalculator.plan(0);
  assert.equal(p.peakCarbG, 0);
  assert.equal(p.days.length, 7);
});
