import test from 'node:test';
import assert from 'node:assert/strict';

import RecoveryCalculator from '../src/modules/core/RecoveryCalculator.js';

test('marathon all-out for an older runner needs weeks, not days', () => {
  const r = RecoveryCalculator.recovery(42.195, 'allout', 40);
  assert.ok(r.beforeHardDays >= 22 && r.beforeHardDays <= 28);
  assert.ok(r.easyDays >= 1 && r.easyDays < r.beforeHardDays);
  assert.equal(r.strategyKeys.length, 7); // refuel/rehydrate/sleep/active/cwi/massage/nsaid
});

test('shorter races and easier efforts recover faster', () => {
  const tenK = RecoveryCalculator.recovery(10, 'easy', 30);
  const full = RecoveryCalculator.recovery(42.195, 'hard', 30);
  assert.ok(tenK.beforeHardDays < full.beforeHardDays);
  assert.ok(tenK.beforeHardDays >= 1);
});

test('age increases recovery time', () => {
  const young = RecoveryCalculator.recovery(21.1, 'hard', 25);
  const old = RecoveryCalculator.recovery(21.1, 'hard', 60);
  assert.ok(old.beforeHardDays >= young.beforeHardDays);
});

test('invalid distance yields an empty plan', () => {
  const r = RecoveryCalculator.recovery(0, 'hard', 40);
  assert.equal(r.beforeHardDays, 0);
  assert.deepEqual(r.strategyKeys, []);
});

test('longer time on feet increases recovery (time-on-feet bump)', () => {
  const fast = RecoveryCalculator.recovery(42.195, 'hard', 35, 3 * 3600); // 3h
  const slow = RecoveryCalculator.recovery(42.195, 'hard', 35, 5 * 3600); // 5h
  assert.ok(slow.beforeHardDays >= fast.beforeHardDays);
});

test('finish time of 1h (or none) leaves the estimate unchanged', () => {
  const oneHour = RecoveryCalculator.recovery(42.195, 'hard', 35, 3600);
  const noTime = RecoveryCalculator.recovery(42.195, 'hard', 35);
  assert.equal(oneHour.beforeHardDays, noTime.beforeHardDays);
});
