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

test('cycleDayFromDate: today == start is day 1', () => {
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-06-24', 28, new Date(2026, 5, 24)), 1);
});

test('cycleDayFromDate: mid-cycle, last day and wrap-around', () => {
  const now = new Date(2026, 5, 24);
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-06-11', 28, now), 14); // 13 days in
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-05-28', 28, now), 28); // diff = L−1
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-05-27', 28, now), 1); // diff = L → wraps
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-05-24', 28, now), 4); // diff = L+3
});

test('cycleDayFromDate: future / invalid / short cycle → null', () => {
  const now = new Date(2026, 5, 24);
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-06-25', 28, now), null); // future
  assert.equal(MenstrualCalculator.cycleDayFromDate('', 28, now), null);
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-13-01', 28, now), null); // bad month
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-02-31', 28, now), null); // nonexistent day
  assert.equal(MenstrualCalculator.cycleDayFromDate('24/06/2026', 28, now), null); // wrong format
  assert.equal(MenstrualCalculator.cycleDayFromDate('2026-06-01', 10, now), null); // length < 21
});

test('cycleDayFromDate: timezone-safe — same calendar day regardless of time', () => {
  const a = MenstrualCalculator.cycleDayFromDate('2026-06-20', 28, new Date(2026, 5, 24, 23, 59));
  const b = MenstrualCalculator.cycleDayFromDate('2026-06-20', 28, new Date(2026, 5, 24, 0, 1));
  assert.equal(a, b);
  assert.equal(a, 5); // 4 days in → day 5
});

test('adjust: pmsWindow only in the late-luteal window', () => {
  const A = (cycleDay: number, phase: 'luteal' | 'follicular' = 'luteal') =>
    MenstrualCalculator.adjust({ phase, cycleLength: 28, cycleDay }).pmsWindow;
  assert.equal(A(28), true); // last day
  assert.equal(A(24), true); // L−4 (inside)
  assert.equal(A(23), false); // L−5 boundary is strict >
  assert.equal(A(26, 'follicular'), false); // wrong phase
  assert.equal(MenstrualCalculator.adjust({ phase: 'luteal', cycleLength: 28 }).pmsWindow, false); // no day
});
