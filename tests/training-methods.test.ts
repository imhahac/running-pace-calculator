import test from 'node:test';
import assert from 'node:assert/strict';

import TrainingMethods from '../src/modules/core/TrainingMethods.js';

test('Yasso 800: marathon h:mm maps to 800m mm:ss', () => {
  // 3:30 marathon → 800m in 3:30 (210s)
  assert.equal(TrainingMethods.yasso800RepSeconds(3 * 3600 + 30 * 60), 210);
  // 4:00 marathon → 800m in 4:00 (240s)
  assert.equal(TrainingMethods.yasso800RepSeconds(4 * 3600), 240);
  assert.equal(TrainingMethods.yasso800RepSeconds(0), 0);
});

test('pacesForMarathon yields a VDOT and ordered paces', () => {
  const { vdot, paces } = TrainingMethods.pacesForMarathon(3 * 3600 + 30 * 60);
  assert.ok(vdot > 0);
  assert.ok(paces.easy > paces.marathon);
  assert.ok(paces.marathon > paces.threshold);
  assert.ok(paces.threshold > paces.interval);
  assert.ok(paces.interval > paces.repetition);
});
