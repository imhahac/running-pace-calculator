import test from 'node:test';
import assert from 'node:assert/strict';

import AcwrCalculator from '../src/modules/core/AcwrCalculator.js';

test('compute: steady load lands in the sweet zone', () => {
  const r = AcwrCalculator.compute([40, 40, 40, 44]);
  assert.ok(r);
  assert.equal(r?.acute, 44);
  assert.equal(r?.chronic, 41);
  assert.ok(Math.abs((r?.acwr ?? 0) - 1.07) < 0.02);
  assert.equal(r?.zone, 'sweet');
  // Next-week guidance keeps acute near 0.8–1.3 × chronic.
  assert.equal(r?.recommendedNextWeekMin, 33);
  assert.equal(r?.recommendedNextWeekMax, 53);
});

test('compute: a spike flags high risk', () => {
  const r = AcwrCalculator.compute([30, 30, 30, 60]);
  assert.equal(r?.zone, 'highrisk');
  assert.ok((r?.acwr ?? 0) > 1.5);
});

test('zoneOf boundaries', () => {
  assert.equal(AcwrCalculator.zoneOf(0.7), 'undertraining');
  assert.equal(AcwrCalculator.zoneOf(1.0), 'sweet');
  assert.equal(AcwrCalculator.zoneOf(1.4), 'caution');
  assert.equal(AcwrCalculator.zoneOf(1.6), 'highrisk');
});

test('compute rejects insufficient or zero data', () => {
  assert.equal(AcwrCalculator.compute([50]), null);
  assert.equal(AcwrCalculator.compute([0, 0]), null);
});

test('riskContext: magnitude scales with ACWR (Gabbett/Hulin)', () => {
  assert.equal(AcwrCalculator.riskContext({ acwr: 1.0, zone: 'sweet' }).magnitudeKey, 'optimal');
  assert.equal(AcwrCalculator.riskContext({ acwr: 1.4, zone: 'caution' }).magnitudeKey, 'elevated');
  assert.equal(AcwrCalculator.riskContext({ acwr: 1.7, zone: 'highrisk' }).magnitudeKey, 'high');
  assert.equal(AcwrCalculator.riskContext({ acwr: 2.1, zone: 'highrisk' }).magnitudeKey, 'extreme');
});

test('riskContext: protective toggles select the matching advice keys', () => {
  const none = AcwrCalculator.riskContext({ acwr: 1.0, zone: 'sweet' });
  assert.deepEqual(none.protectiveKeys, ['strength_off', 'shoes_off']);
  const both = AcwrCalculator.riskContext({
    acwr: 1.0,
    zone: 'sweet',
    strengthTraining: true,
    shoeRotation: true
  });
  assert.deepEqual(both.protectiveKeys, ['strength_on', 'shoes_on']);
});
