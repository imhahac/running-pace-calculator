import test from 'node:test';
import assert from 'node:assert/strict';

import IntervalBuilder from '../src/modules/core/IntervalBuilder.js';

test('interval session is capped by weekly mileage (8% rule)', () => {
  // 40 km/wk → cap = min(10, 3.2) = 3.2 km → 800m reps → 4 reps (< default 6)
  const s = IntervalBuilder.build(50, 40, 'I');
  assert.ok(s);
  assert.equal(s?.repMeters, 800);
  assert.equal(s?.reps, 4);
  assert.equal(s?.cappedByWeekly, true);
  assert.ok(Math.abs((s?.mainKm ?? 0) - 3.2) < 1e-9);
});

test('higher weekly mileage allows the default rep count', () => {
  // 80 km/wk → cap = min(10, 6.4) = 6.4 km → up to 8 reps, default 6 wins
  const s = IntervalBuilder.build(50, 80, 'I');
  assert.equal(s?.reps, 6);
  assert.equal(s?.cappedByWeekly, false);
  assert.equal(s?.warmupKm, 2);
  assert.equal(s?.cooldownKm, 2);
  assert.ok((s?.totalKm ?? 0) > s!.mainKm);
});

test('workout types pick the matching pace and rep distance', () => {
  const i = IntervalBuilder.build(50, 80, 'I');
  const r = IntervalBuilder.build(50, 80, 'R');
  const t = IntervalBuilder.build(50, 80, 'T');
  assert.equal(r?.repMeters, 400);
  assert.equal(t?.repMeters, 1600);
  // R pace faster (smaller s/km) than I, I faster than T
  assert.ok((r?.repPaceSec ?? 0) < (i?.repPaceSec ?? 0));
  assert.ok((i?.repPaceSec ?? 0) < (t?.repPaceSec ?? 0));
});

test('invalid VDOT → null', () => {
  assert.equal(IntervalBuilder.build(0, 40, 'I'), null);
});

test('Daniels per-type caps: R uses 5%/8 km (tighter than I)', () => {
  // R at 40 km/wk → cap = min(8, 2) = 2 km → 400m reps → 5 reps (< default 8)
  const rLow = IntervalBuilder.build(50, 40, 'R');
  assert.equal(rLow?.repMeters, 400);
  assert.equal(rLow?.reps, 5);
  assert.equal(rLow?.cappedByWeekly, true);
  // R at 80 km/wk → cap = min(8, 4) = 4 km → 10 possible, default 8 wins
  assert.equal(IntervalBuilder.build(50, 80, 'R')?.reps, 8);
});

test('goal race distance tunes I rep length', () => {
  assert.equal(IntervalBuilder.build(50, 100, 'I', { goalDistanceM: 5000 })?.repMeters, 800);
  assert.equal(IntervalBuilder.build(50, 100, 'I', { goalDistanceM: 42195 })?.repMeters, 1200);
});

test('phase and quality-days scale session volume down', () => {
  const quality = IntervalBuilder.build(50, 100, 'I', { phase: 'quality' });
  const base = IntervalBuilder.build(50, 100, 'I', { phase: 'base' });
  assert.ok((base?.reps ?? 0) < (quality?.reps ?? 0), 'base phase trims volume');

  const oneDay = IntervalBuilder.build(50, 100, 'I', { qualityDays: 1 });
  const fourDay = IntervalBuilder.build(50, 100, 'I', { qualityDays: 4 });
  assert.ok((fourDay?.reps ?? 0) < (oneDay?.reps ?? 0), 'more quality days → smaller session');
  assert.ok((fourDay?.reps ?? 0) >= 2, 'never below the 2-rep floor');
});

test('default opts preserve the baseline session (backward compatible)', () => {
  const withOpts = IntervalBuilder.build(50, 80, 'I', {});
  const noOpts = IntervalBuilder.build(50, 80, 'I');
  assert.deepEqual(withOpts, noOpts);
  assert.equal(noOpts?.reps, 6);
});

test('phase/quality-day modifiers never exceed the Daniels per-type cap', () => {
  // I at 60 km/wk → cap = min(10, 8% × 60) = 4.8 km; modifiers only trim volume.
  const phases = ['base', 'quality', 'peak'] as const;
  for (const phase of phases) {
    for (let qd = 1; qd <= 5; qd += 1) {
      const s = IntervalBuilder.build(50, 60, 'I', { phase, qualityDays: qd });
      assert.ok(
        (s?.mainKm ?? 0) <= 4.8 + 1e-9,
        `main ${s?.mainKm} km within 4.8 km cap (phase ${phase}, qd ${qd})`
      );
    }
  }
});
