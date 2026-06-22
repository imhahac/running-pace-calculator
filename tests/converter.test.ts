import test from 'node:test';
import assert from 'node:assert/strict';

import Converter from '../src/modules/core/Converter.js';

const KM_TO_MILE = 0.621371192;
const MILE_TO_KM = 1.609344;

test('distance km<->mile round-trips within tolerance', () => {
  const km = 42.195;
  const miles = Converter.kmToMile(km);
  assert.ok(Math.abs(miles - km * KM_TO_MILE) < 1e-9);
  assert.ok(Math.abs(Converter.mileToKm(miles) - km) < 1e-6);
});

test('speed kph<->mph round-trips within tolerance', () => {
  const kph = 12;
  const mph = Converter.kphToMph(kph);
  assert.ok(Math.abs(mph - kph * KM_TO_MILE) < 1e-9);
  assert.ok(Math.abs(Converter.mphToKph(mph) - kph) < 1e-6);
});

test('paceMileToKm makes a per-mile pace map to a faster per-km number', () => {
  // 360 s/mile (6:00/mile) -> seconds per km is smaller, since a km is shorter than a mile
  const perKm = Converter.paceMileToKm(360);
  assert.ok(Math.abs(perKm - 360 * KM_TO_MILE) < 1e-9);
  assert.ok(perKm < 360);
});

test('getPaceConversionFactor returns identity for same unit', () => {
  assert.equal(Converter.getPaceConversionFactor('km', 'km'), 1);
  assert.equal(Converter.getPaceConversionFactor('mile', 'mile'), 1);
  assert.ok(Math.abs(Converter.getPaceConversionFactor('km', 'mile') - KM_TO_MILE) < 1e-9);
  assert.ok(Math.abs(Converter.getPaceConversionFactor('mile', 'km') - MILE_TO_KM) < 1e-9);
});

test('getDistanceConversionFactor', () => {
  assert.equal(Converter.getDistanceConversionFactor('km'), 1);
  assert.ok(Math.abs(Converter.getDistanceConversionFactor('mile') - KM_TO_MILE) < 1e-9);
});
