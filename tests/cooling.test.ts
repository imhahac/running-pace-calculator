import test from 'node:test';
import assert from 'node:assert/strict';

import CoolingCalculator from '../src/modules/core/CoolingCalculator.js';

test('hot race: extreme risk → full strategy set + ice slurry dose', () => {
  const p = CoolingCalculator.plan(70, 32, 75);
  assert.equal(p.risk, 'extreme');
  assert.ok(p.wbgtC > 28);
  assert.equal(p.iceSlurryG, 525); // 7.5 × 70
  assert.ok(p.strategyKeys.includes('slurry'));
  assert.ok(p.strategyKeys.includes('postpone'));
});

test('cool race: low risk → minimal strategies', () => {
  const p = CoolingCalculator.plan(70, 8, 40);
  assert.equal(p.risk, 'low');
  assert.deepEqual(p.strategyKeys, ['hydrate']);
});

test('zero weight → no slurry dose', () => {
  const p = CoolingCalculator.plan(0, 30, 70);
  assert.equal(p.iceSlurryG, 0);
});
