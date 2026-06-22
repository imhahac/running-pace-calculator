import test from 'node:test';
import assert from 'node:assert/strict';

import Calculator from '../src/modules/core/Calculator.js';
import TimeFormatter from '../src/modules/core/TimeFormatter.js';
import {
  DEFAULT_STATE,
  TRAINING_ZONES,
  RIEGEL_EXPONENT,
  FULL_MARATHON_METERS
} from '../src/constants/index.js';

test('track mode: 90s for a 400m lap on lane 400 equals 90 sec/lap', () => {
  const state = { ...DEFAULT_STATE, mode: 'track', lane: 400, trackDistance: 400 };
  const sec = Calculator.calculateSecondsPerLap('track', state, 0, 0, 90, 0, '');
  assert.ok(Math.abs(sec - 90) < 1e-9);
});

test('track mode: a 90s/400m effort scales to lane 200', () => {
  const state = { ...DEFAULT_STATE, mode: 'track', lane: 200, trackDistance: 400 };
  const sec = Calculator.calculateSecondsPerLap('track', state, 0, 0, 90, 0, '');
  assert.ok(Math.abs(sec - 45) < 1e-9);
});

test('pace mode: mile unit is converted to km before computing sec/lap', () => {
  const kmState = { ...DEFAULT_STATE, mode: 'pace', lane: 1000, paceUnit: 'km' as const };
  const mileState = { ...DEFAULT_STATE, mode: 'pace', lane: 1000, paceUnit: 'mile' as const };

  // 6:00/km
  const kmSec = Calculator.calculateSecondsPerLap('pace', kmState, 6, 0, 0, 0, '');
  assert.ok(Math.abs(kmSec - 360) < 1e-9);

  // 6:00/mile is faster per km, so sec/km should be < 360
  const mileSec = Calculator.calculateSecondsPerLap('pace', mileState, 6, 0, 0, 0, '');
  assert.ok(mileSec < kmSec);
  // 360s/mile / 1.609344 km/mile ≈ 223.7 s/km
  assert.ok(Math.abs(mileSec - 360 / 1.609344) < 0.5);
});

test('treadmill mode: mile/h is converted to km/h', () => {
  const state = { ...DEFAULT_STATE, mode: 'treadmill', lane: 1000, treadmillUnit: 'mile' as const };
  // 6 mph -> 9.656 km/h ; sec/km = 3600 / 9.656 ≈ 372.8
  const sec = Calculator.calculateSecondsPerLap('treadmill', state, 0, 0, 0, 6, '');
  assert.ok(Math.abs(sec - 3600 / (6 * 1.609344)) < 0.5);
});

test('calculateSplits: 96 sec/lap over 400m yields proportional splits', () => {
  const splits = Calculator.calculateSplits(96, 400);
  // perMeter = 0.24 s/m -> 100m = 24s, 400m = 96s
  assert.equal(splits['m100'], TimeFormatter.format(24));
  assert.equal(splits['m400'], TimeFormatter.format(96));
  // 200m increment over 100m = 48 - 24 = 24
  assert.equal(splits['inc200'], '(+24)');
});

test('calculateTrainingZones: applies multipliers to base pace', () => {
  const base = 300; // 5:00/km
  const zones = Calculator.calculateTrainingZones(base);
  // easy = base * 1.2 = 360s = 06:00
  assert.equal(zones.easy, TimeFormatter.format(base * TRAINING_ZONES.easy));
  assert.equal(zones.easy, '06:00');
  // interval = base * 0.9 = 270s = 04:30
  assert.equal(zones.interval, '04:30');
  void TRAINING_ZONES; // referenced for intent
});

test('predictFinishTime: Riegel scales with distance exponent', () => {
  // reference: 5K at 240 s/km -> reference time = 1200s
  const predicted = Calculator.predictFinishTime(5000, 240, 10000);
  const expected = ((240 * 5000) / 1000) * Math.pow(10000 / 5000, RIEGEL_EXPONENT);
  assert.ok(Math.abs(predicted - expected) < 1e-6);
  // doubling distance should more than double time (exponent > 1)
  assert.ok(predicted > 2400);
  void FULL_MARATHON_METERS;
});

test('predictFinishTime: non-positive inputs return 0', () => {
  assert.equal(Calculator.predictFinishTime(0, 240, 10000), 0);
  assert.equal(Calculator.predictFinishTime(5000, 0, 10000), 0);
  assert.equal(Calculator.predictFinishTime(5000, 240, 0), 0);
});
