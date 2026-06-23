import test from 'node:test';
import assert from 'node:assert/strict';

import AltitudeCalculator from '../src/modules/core/AltitudeCalculator.js';

test('adequate LHTL block in the sweet spot → gains + flags ok', () => {
  const r = AltitudeCalculator.analyze(2200, 21, 16, 'LHTL');
  assert.ok(r);
  assert.equal(r?.totalHours, 336);
  assert.ok((r?.hbMassGainPct ?? 0) > 0);
  assert.ok((r?.vo2GainPct ?? 0) > 0 && (r?.vo2GainPct ?? 0) < (r?.hbMassGainPct ?? 0));
  assert.equal(r?.altitudeOk, true);
  assert.equal(r?.hoursOk, true);
});

test('too-low altitude → no Hb gain, altitude flag false', () => {
  const r = AltitudeCalculator.analyze(1500, 21, 16);
  assert.equal(r?.hbMassGainPct, 0);
  assert.equal(r?.altitudeOk, false);
});

test('Hb gain is capped at 5%', () => {
  const r = AltitudeCalculator.analyze(2400, 60, 18); // huge exposure
  assert.equal(r?.hbMassGainPct, 5);
});

test('IHE has a lower hours threshold', () => {
  const r = AltitudeCalculator.analyze(2400, 10, 8, 'IHE'); // 80 h
  assert.equal(r?.hoursOk, true);
});

test('rejects invalid input', () => {
  assert.equal(AltitudeCalculator.analyze(0, 21, 16), null);
  assert.equal(AltitudeCalculator.analyze(2200, 0, 16), null);
});
