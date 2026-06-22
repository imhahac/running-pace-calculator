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
