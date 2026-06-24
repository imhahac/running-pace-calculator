import test from 'node:test';
import assert from 'node:assert/strict';

import MenstrualCalculator from '../src/modules/core/MenstrualCalculator.js';

test('28-day cycle phase boundaries', () => {
  assert.equal(MenstrualCalculator.phase(3), 'menstrual');
  assert.equal(MenstrualCalculator.phase(10), 'follicular');
  assert.equal(MenstrualCalculator.phase(14), 'ovulation'); // 28 − 14 = 14
  assert.equal(MenstrualCalculator.phase(22), 'luteal');
});

test('luteal anchored 14 days before next period (shorter cycle)', () => {
  // length 24 → ovulation ~ day 10
  assert.equal(MenstrualCalculator.phase(10, 24), 'ovulation');
  assert.equal(MenstrualCalculator.phase(20, 24), 'luteal');
});

test('rejects out-of-range input', () => {
  assert.equal(MenstrualCalculator.phase(0), null);
  assert.equal(MenstrualCalculator.phase(30, 28), null);
  assert.equal(MenstrualCalculator.phase(5, 10), null); // length < 21
});

test('adjust: no symptoms → go, normal cycle → no RED-S flag', () => {
  const a = MenstrualCalculator.adjust({ phase: 'follicular', cycleLength: 28 });
  assert.equal(a.readiness, 'go');
  assert.equal(a.recommendationKey, 'go');
  assert.equal(a.redSFlag, false);
});

test('adjust: severe period pain pulls the session to easy', () => {
  assert.equal(
    MenstrualCalculator.adjust({ phase: 'follicular', dysmenorrhea: 'severe' }).readiness,
    'easy'
  );
});

test('adjust: mild pain + poor sleep → caution', () => {
  const a = MenstrualCalculator.adjust({ phase: 'ovulation', dysmenorrhea: 'mild', sleepHours: 5 });
  assert.equal(a.readiness, 'caution'); // load 1 + 1 = 2
});

test('adjust: low mood alone → caution', () => {
  assert.equal(MenstrualCalculator.adjust({ phase: 'luteal', mood: 'low' }).readiness, 'caution');
});

test('adjust: RED-S flag when cycle length is irregular', () => {
  assert.equal(MenstrualCalculator.adjust({ phase: 'luteal', cycleLength: 40 }).redSFlag, true);
  assert.equal(MenstrualCalculator.adjust({ phase: 'luteal', cycleLength: 28 }).redSFlag, false);
});
