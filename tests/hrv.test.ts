import test from 'node:test';
import assert from 'node:assert/strict';

import HrvCalculator from '../src/modules/core/HrvCalculator.js';

test('stable readings → normal status', () => {
  const r = HrvCalculator.analyze([60, 62, 58, 61, 59, 63, 60]);
  assert.ok(r);
  assert.equal(r?.status, 'normal');
  assert.ok((r?.baseline ?? 0) > 58 && (r?.baseline ?? 0) < 62);
  assert.ok((r?.cv ?? 0) > 0);
});

test('a sharp drop today → suppressed (low)', () => {
  const r = HrvCalculator.analyze([60, 62, 58, 61, 59, 63, 40]);
  assert.equal(r?.status, 'low');
  assert.ok((r?.today ?? 0) < (r?.lower ?? 0));
});

test('a spike today → elevated (high)', () => {
  const r = HrvCalculator.analyze([50, 52, 48, 51, 49, 53, 70]);
  assert.equal(r?.status, 'high');
  assert.ok((r?.today ?? 0) > (r?.upper ?? 0));
});

test('needs at least 3 valid readings', () => {
  assert.equal(HrvCalculator.analyze([60, 62]), null);
  assert.equal(HrvCalculator.analyze([0, -1]), null);
});

test('baseline uses only the most recent 7 prior days (Plews window)', () => {
  const recent = [60, 61, 59, 62, 60, 61, 58]; // 7 prior days ~60
  const clean = HrvCalculator.analyze([...recent, 60]);
  // Old wild readings BEYOND the 7-day window must not move the baseline.
  const withOldOutlier = HrvCalculator.analyze([200, 200, ...recent, 60]);
  assert.ok(clean && withOldOutlier);
  assert.equal(withOldOutlier?.baseline, clean?.baseline);
});
