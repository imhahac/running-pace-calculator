import test from 'node:test';
import assert from 'node:assert/strict';

import {
  raceMatchesDistance,
  raceHasHalfOrFull,
  DISTANCE_CATEGORIES
} from '../src/modules/ui/raceDistance.js';

test('raceHasHalfOrFull: matches numeric and text half/full distances', () => {
  assert.equal(raceHasHalfOrFull('42.2K, 21K'), true);
  assert.equal(raceHasHalfOrFull('全馬 | 半馬'), true);
  assert.equal(raceHasHalfOrFull('半馬 | 10.0 km | 5.0 km'), true);
  assert.equal(raceHasHalfOrFull('42.195K, 21K, 10K, 5K'), true);
  assert.equal(raceHasHalfOrFull('100.7K, 42.5K, 22.04K'), true); // 42.5 full, 22.04 half
});

test('raceHasHalfOrFull: rejects short/ultra/timed/empty', () => {
  assert.equal(raceHasHalfOrFull('10K, 5K, 3K'), false);
  assert.equal(raceHasHalfOrFull('100K, 70K, 50K'), false); // pure ultra
  assert.equal(raceHasHalfOrFull('5H'), false); // timed run
  assert.equal(raceHasHalfOrFull('25K, 15K'), false); // neither half nor full band
  assert.equal(raceHasHalfOrFull(''), false);
  assert.equal(raceHasHalfOrFull(undefined), false);
});

test('raceMatchesDistance: a multi-distance race matches every category it offers', () => {
  const d = '42K, 21K, 10K, 5K';
  assert.equal(raceMatchesDistance(d, 'full'), true);
  assert.equal(raceMatchesDistance(d, 'half'), true);
  assert.equal(raceMatchesDistance(d, '10k'), true);
  assert.equal(raceMatchesDistance(d, '5k'), true);
  assert.equal(raceMatchesDistance(d, 'ultra'), false);
});

test('raceMatchesDistance: ultra-only and text-only', () => {
  assert.equal(raceMatchesDistance('100K, 70K, 50K', 'ultra'), true);
  assert.equal(raceMatchesDistance('100K, 70K, 50K', 'full'), false);
  assert.equal(raceMatchesDistance('全馬 | 半馬', 'full'), true);
  assert.equal(raceMatchesDistance('全馬 | 半馬', 'half'), true);
  assert.equal(raceMatchesDistance('全馬 | 半馬', '10k'), false);
});

test('raceMatchesDistance: band boundaries', () => {
  assert.equal(raceMatchesDistance('43K', 'full'), true); // 40–44 inclusive
  assert.equal(raceMatchesDistance('44K', 'full'), true);
  assert.equal(raceMatchesDistance('45K', 'full'), false); // → ultra
  assert.equal(raceMatchesDistance('45K', 'ultra'), true);
  assert.equal(raceMatchesDistance('44K', 'ultra'), false);
  assert.equal(raceMatchesDistance('23K', 'half'), true); // 20–23 inclusive
  assert.equal(raceMatchesDistance('24K', 'half'), false);
});

test('DISTANCE_CATEGORIES is the expected ordered set', () => {
  assert.deepEqual(DISTANCE_CATEGORIES, ['full', 'half', '10k', '5k', 'ultra']);
});
