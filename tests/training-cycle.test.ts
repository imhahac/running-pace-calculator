import test from 'node:test';
import assert from 'node:assert/strict';

import Calculator from '../src/modules/Calculator.js';

test('training cycle generates at least one week for future date', () => {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  const iso = date.toISOString().slice(0, 10);

  const plan = Calculator.generateTrainingCycle(300, iso, {
    base: 'base',
    build: 'build',
    peak: 'peak',
    taper: 'taper',
    race: 'race'
  }, {
    easy: 'easy',
    tempo: 'tempo',
    interval: 'interval',
    race: 'race'
  });

  assert.ok(plan.length >= 3);
  assert.equal(plan[plan.length - 1].focus, 'race');
  assert.ok(typeof plan[0].totalMileageKm === 'number');
});
