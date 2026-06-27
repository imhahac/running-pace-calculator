import test from 'node:test';
import assert from 'node:assert/strict';

import HrvCalculator from '../src/modules/core/HrvCalculator.js';

test('HRV low alone → easy; low + poor wellness → rest', () => {
  const a = HrvCalculator.recommend('low', null);
  assert.equal(a.score, 40);
  assert.equal(a.level, 'easy');
  assert.equal(a.reason, 'low');

  const b = HrvCalculator.recommend('low', 30); // 0.6*40 + 0.4*30 = 36
  assert.equal(b.score, 36);
  assert.equal(b.level, 'rest');
  assert.equal(b.reason, 'low');
});

test('HRV normal: good wellness → quality; poor wellness downgrades to moderate', () => {
  const good = HrvCalculator.recommend('normal', 100);
  assert.equal(good.score, 100);
  assert.equal(good.level, 'quality');
  assert.equal(good.reason, 'normal');

  const poor = HrvCalculator.recommend('normal', 30); // 60 + 12 = 72
  assert.equal(poor.score, 72);
  assert.equal(poor.level, 'moderate');
  assert.equal(poor.reason, 'normal');
});

test('HRV high + poor wellness → saturation flag, downgraded', () => {
  const r = HrvCalculator.recommend('high', 30); // 0.6*85 + 0.4*30 = 63
  assert.equal(r.score, 63);
  assert.equal(r.level, 'moderate');
  assert.equal(r.reason, 'saturation');

  const fine = HrvCalculator.recommend('high', 100); // 51 + 40 = 91
  assert.equal(fine.level, 'quality');
  assert.equal(fine.reason, 'high');
});

test('no HRV → recommendation from wellness alone (reason "wellness")', () => {
  const r = HrvCalculator.recommend(null, 65);
  assert.equal(r.score, 65);
  assert.equal(r.level, 'moderate');
  assert.equal(r.reason, 'wellness');
});

test('neither signal → null recommendation', () => {
  const r = HrvCalculator.recommend(null, null);
  assert.deepEqual(r, { score: null, level: null, reason: null });
});

test('HRV normal with no wellness still recommends from HRV alone', () => {
  const r = HrvCalculator.recommend('normal', null);
  assert.equal(r.score, 100);
  assert.equal(r.level, 'quality');
  assert.equal(r.reason, 'normal');
});
