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

test('training cycle mileage scales by plan distance', () => {
  const date = new Date();
  date.setDate(date.getDate() + 35);
  const iso = date.toISOString().slice(0, 10);

  const focusMap = {
    base: 'base',
    build: 'build',
    peak: 'peak',
    taper: 'taper',
    race: 'race'
  };
  const workoutMap = {
    easy: 'easy',
    tempo: 'tempo',
    interval: 'interval',
    race: 'race'
  };

  const fullPlan = Calculator.generateTrainingCycle(300, iso, focusMap, workoutMap, 42195);
  const tenKPlan = Calculator.generateTrainingCycle(300, iso, focusMap, workoutMap, 10000);

  assert.ok(fullPlan.length > 0);
  assert.ok(tenKPlan.length > 0);
  assert.ok(fullPlan[0].totalMileageKm > tenKPlan[0].totalMileageKm);
});
