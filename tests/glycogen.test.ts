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

test('distance gating: short events (<~90 min) need no loading', () => {
  const p10k = GlycogenCalculator.plan(60, 'modifiedSherman', 10000); // ~55 min
  assert.equal(p10k.needed, false);
  assert.equal(p10k.days.length, 0);
  assert.equal(p10k.loadGperKg, 0);
  assert.equal(GlycogenCalculator.plan(60, 'modifiedSherman', 5000).needed, false);
});

test('distance gating: long events load with peak scaled into 10–12 g/kg', () => {
  const half = GlycogenCalculator.plan(60, 'modifiedSherman', 21097.5); // ~116 min
  assert.equal(half.needed, true);
  assert.ok(half.loadGperKg >= 10 && half.loadGperKg <= 12);
  const full = GlycogenCalculator.plan(60, 'modifiedSherman', 42195); // ~232 min
  assert.equal(full.needed, true);
  assert.ok(full.loadGperKg > half.loadGperKg, 'longer event → higher peak');
  assert.ok(full.loadGperKg <= 12);
});

test('pre-race top-up is 1–4 g/kg of body weight', () => {
  const p = GlycogenCalculator.plan(70, 'modifiedSherman', 42195);
  assert.equal(p.preRaceMeal.gramsLo, 70); // 1 × 70
  assert.equal(p.preRaceMeal.gramsHi, 280); // 4 × 70
});

test('estimateEventMinutes: 0 when distance unknown, scales with distance', () => {
  assert.equal(GlycogenCalculator.estimateEventMinutes(), 0);
  assert.equal(GlycogenCalculator.estimateEventMinutes(0), 0);
  assert.ok(GlycogenCalculator.estimateEventMinutes(42195) > 200);
});

test('goal time overrides the distance estimate for the ≥90-min gate', () => {
  // A 10K estimates ~55 min → normally "not needed"…
  assert.equal(GlycogenCalculator.plan(60, 'modifiedSherman', 10000).needed, false);
  // …but a 95-min 10K finisher exceeds the threshold → loading needed.
  assert.equal(GlycogenCalculator.plan(60, 'modifiedSherman', 10000, 95 * 60).needed, true);
  // A half estimates ~116 min → needed, but run in 80 min it is not.
  assert.equal(GlycogenCalculator.plan(60, 'modifiedSherman', 21097.5, 80 * 60).needed, false);
});
