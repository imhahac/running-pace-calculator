import test from 'node:test';
import assert from 'node:assert/strict';

import Calculator from '../src/modules/Calculator.js';
import { DEFAULT_STATE } from '../src/constants/index.js';

test('pace mode: 4:00 min/km on 400m lane equals 96 sec/lap', () => {
  const state = { ...DEFAULT_STATE, mode: 'pace', lane: 400, paceUnit: 'km' as const };
  const sec = Calculator.calculateSecondsPerLap('pace', state, 4, 0, 0, 0, '');
  assert.equal(sec, 96);
});

test('finish_time mode: 20:00 for 5K gives ~96 sec/lap on 400m lane', () => {
  const state = { ...DEFAULT_STATE, mode: 'finish_time', lane: 400, distance: 5000 };
  const sec = Calculator.calculateSecondsPerLap('finish_time', state, 0, 0, 0, 0, '20:00');
  assert.ok(Math.abs(sec - 96) < 0.0001);
});

test('treadmill mode: 12 km/h on 400m lane equals 120 sec/lap', () => {
  const state = { ...DEFAULT_STATE, mode: 'treadmill', lane: 400, treadmillUnit: 'km' as const };
  const sec = Calculator.calculateSecondsPerLap('treadmill', state, 0, 0, 0, 12, '');
  assert.ok(Math.abs(sec - 120) < 0.0001);
});

test('invalid input should return 0 seconds/lap', () => {
  const state = { ...DEFAULT_STATE, mode: 'finish_time', lane: 400, distance: 42195 };
  const sec = Calculator.calculateSecondsPerLap('finish_time', state, 0, 0, 0, 0, 'abc');
  assert.equal(sec, 0);
});
