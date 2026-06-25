import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeEmail,
  isValidEmail,
  corsAllowOrigin,
  buildMagicLinkUrl,
  normalizeRaceDate,
  tryParseRaces,
  mergeRaces,
  safeParseArray,
  validateRaces,
  sha256Hex
} from '../src/lib.js';

test('email helpers', () => {
  assert.equal(normalizeEmail('  A@B.COM '), 'a@b.com');
  assert.ok(isValidEmail('a@b.com'));
  assert.ok(!isValidEmail('nope'));
  assert.ok(!isValidEmail('a@b'));
});

test('corsAllowOrigin normalises a path-bearing configured value to a bare origin', () => {
  // The footgun: APP_URL with a path must not become an invalid ACAO value.
  assert.equal(
    corsAllowOrigin(
      'https://imhahac.github.io/running-pace-calculator/',
      'https://imhahac.github.io'
    ),
    'https://imhahac.github.io'
  );
  assert.equal(corsAllowOrigin('*', 'https://anything'), '*');
  // Mismatched request origin → falls back to the configured (normalised) origin.
  assert.equal(corsAllowOrigin('https://example.com', 'https://evil.com'), 'https://example.com');
});

test('buildMagicLinkUrl handles existing query strings', () => {
  assert.equal(buildMagicLinkUrl('https://app/', 'tok'), 'https://app/?login=tok');
  assert.equal(buildMagicLinkUrl('https://app/?x=1', 'tok'), 'https://app/?x=1&login=tok');
});

test('normalizeRaceDate', () => {
  assert.equal(normalizeRaceDate('2026/3/9'), '2026-03-09');
  assert.equal(normalizeRaceDate('2026-12-20'), '2026-12-20');
  assert.equal(normalizeRaceDate('garbage'), '');
});

test('tryParseRaces: JSON array → records; HTML → []', () => {
  const json = JSON.stringify([{ date: '2026/12/20', name: '台北馬', city: '台北', url: 'u' }]);
  const out = tryParseRaces(json);
  assert.equal(out.length, 1);
  assert.equal(out[0].date, '2026-12-20');
  assert.equal(out[0].name, '台北馬');
  assert.equal(out[0].location, '台北');
  assert.deepEqual(tryParseRaces('<html>not json</html>'), []);
});

test('mergeRaces dedupes by date+name', () => {
  const existing = [{ date: '2026-12-20', name: 'A' }];
  const { list, added } = mergeRaces(existing, [
    { date: '2026-12-20', name: 'A' },
    { date: '2026-12-21', name: 'B' }
  ]);
  assert.equal(added, 1);
  assert.equal(list.length, 2);
});

test('safeParseArray tolerates null / corrupt / non-array', () => {
  assert.deepEqual(safeParseArray(null), []);
  assert.deepEqual(safeParseArray('not json'), []);
  assert.deepEqual(safeParseArray('{"a":1}'), []); // object, not array
  assert.deepEqual(safeParseArray('[{"date":"2026-01-01","name":"X"}]'), [
    { date: '2026-01-01', name: 'X' }
  ]);
});

test('validateRaces accepts well-formed lists and rejects bad shape/size', () => {
  assert.equal(validateRaces([{ date: '2026-01-01', name: 'X' }]).ok, true);
  assert.equal(validateRaces('nope').ok, false);
  assert.equal(validateRaces([{ name: 'X' }]).ok, false); // missing date
  assert.equal(validateRaces([{ date: '2026-01-01' }]).ok, false); // missing name
  assert.equal(validateRaces([1, 2, 3]).ok, false); // not objects
  assert.equal(validateRaces(new Array(10), { maxCount: 5 }).ok, false); // too many
  assert.equal(validateRaces([{ date: 'd', name: 'n' }], { maxBytes: 5 }).ok, false); // too big
});

test('sha256Hex is a stable 64-char lowercase hex digest', async () => {
  const h = await sha256Hex('abc');
  assert.equal(h, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(await sha256Hex('abc'), h); // deterministic
});
