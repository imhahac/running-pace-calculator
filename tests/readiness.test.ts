import test from 'node:test';
import assert from 'node:assert/strict';

import ReadinessCalculator from '../src/modules/core/ReadinessCalculator.js';

test('all four factors present → averaged score + level + no n/a', () => {
  const r = ReadinessCalculator.compute({
    hrvStatus: 'normal',
    acwrZone: 'sweet',
    recoveryDays: 1,
    wellnessScore: 100
  });
  assert.equal(r.score, 100);
  assert.equal(r.level, 'go');
  assert.ok(r.factors.every((f) => f.state !== 'na'));
});

test('subjective wellness is the 4th factor and joins the average', () => {
  // hrv 100, acwr 100, recovery 100, wellness 30 → avg(330/4)=82.5→83 → go
  const r = ReadinessCalculator.compute({
    hrvStatus: 'normal',
    acwrZone: 'sweet',
    recoveryDays: 1,
    wellnessScore: 30
  });
  const wellness = r.factors.find((f) => f.key === 'wellness');
  assert.equal(wellness?.score, 30);
  assert.equal(wellness?.state, 'bad');
  assert.equal(r.score, 83);

  // wellness omitted → that factor is n/a and excluded
  const without = ReadinessCalculator.compute({ hrvStatus: 'normal' });
  assert.equal(without.factors.find((f) => f.key === 'wellness')?.state, 'na');
  assert.equal(without.score, 100);
});

test('missing factor is n/a and excluded from the average', () => {
  // Only ACWR caution (60) + recovery 3 days (70) → avg 65 → caution.
  const r = ReadinessCalculator.compute({ acwrZone: 'caution', recoveryDays: 3 });
  const hrv = r.factors.find((f) => f.key === 'hrv');
  assert.equal(hrv?.state, 'na');
  assert.equal(hrv?.score, null);
  assert.equal(r.score, 65);
  assert.equal(r.level, 'caution');
});

test('no factors available → null score/level, all n/a', () => {
  const r = ReadinessCalculator.compute({});
  assert.equal(r.score, null);
  assert.equal(r.level, null);
  assert.ok(r.factors.every((f) => f.state === 'na'));
});

test('poor signals → low readiness (rest/easy)', () => {
  // HRV low (40) + ACWR highrisk (30) → avg 35 → rest.
  const r = ReadinessCalculator.compute({ hrvStatus: 'low', acwrZone: 'highrisk' });
  assert.equal(r.score, 35);
  assert.equal(r.level, 'rest');
  assert.equal(r.factors.find((f) => f.key === 'hrv')?.state, 'bad');
});
