import test from 'node:test';
import assert from 'node:assert/strict';

import ShareManager from '../src/modules/ShareManager.js';

test('share manager can build and parse URL payload', () => {
  const w = globalThis as any;
  const originalWindow = w.window;
  w.window = { location: new URL('https://example.com/') };

  const url = ShareManager.buildShareURL({
    state: { mode: 'pace' },
    inputs: { pace_input: '4', pace_input2: '30' },
    trainingTargetDate: '2026-12-31',
    trainingPlanDistance: 10000
  });

  w.window.location = new URL(url);

  const parsed = ShareManager.readPayloadFromURL();
  assert.ok(parsed);
  assert.equal(parsed?.inputs.pace_input, '4');
  assert.equal(parsed?.trainingTargetDate, '2026-12-31');
  assert.equal(parsed?.trainingPlanDistance, 10000);

  w.window = originalWindow;
});
