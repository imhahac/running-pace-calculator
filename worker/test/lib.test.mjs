import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeEmail,
  isValidEmail,
  corsAllowOrigin,
  buildMagicLinkUrl,
  normalizeRaceDate,
  tryParseRaces,
  mergeRaces
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
