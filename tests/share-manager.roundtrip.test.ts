import test from 'node:test';
import assert from 'node:assert/strict';

import { encodePayload, decodePayload } from '../src/modules/state/ShareManager.js';
import type { ISharePayload } from '../src/types/index';

test('encode -> decode preserves state, inputs and training fields', () => {
  const payload: ISharePayload = {
    state: {
      mode: 'track',
      paceUnit: 'mile',
      treadmillUnit: 'km',
      venue: 'warmup_300',
      lane: 453,
      distance: 21097.5,
      splitMode: 'road',
      lang: 'en'
    },
    inputs: {
      pace_input: '4',
      pace_input2: '30',
      track_input: '88',
      treadmill_input: '12.5',
      finish_time_input: '1:45:00'
    },
    trainingTargetDate: '2026-10-01',
    trainingPlanDistance: 42195
  };

  const decoded = decodePayload(encodePayload(payload));
  assert.ok(decoded);
  assert.equal(decoded!.state.mode, 'track');
  assert.equal(decoded!.state.paceUnit, 'mile');
  assert.equal(decoded!.state.venue, 'warmup_300');
  assert.equal(decoded!.state.lane, 453);
  assert.equal(decoded!.state.distance, 21097.5);
  assert.equal(decoded!.state.splitMode, 'road');
  assert.equal(decoded!.state.lang, 'en');
  assert.deepEqual(decoded!.inputs, payload.inputs);
  assert.equal(decoded!.trainingTargetDate, '2026-10-01');
  assert.equal(decoded!.trainingPlanDistance, 42195);
});

test('decode returns null for malformed input', () => {
  assert.equal(decodePayload('!!!not-valid-base64!!!@@@'), null);
});

test('encode is URL-safe (no +, / or = padding)', () => {
  const encoded = encodePayload({
    state: { mode: 'pace', lane: 400 },
    inputs: { pace_input: '5', pace_input2: '00' }
  });
  assert.ok(!/[+/=]/.test(encoded));
});
