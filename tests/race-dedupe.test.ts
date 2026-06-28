import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeRaceName, dedupePreferBiji } from '../src/modules/ui/raceDedupe.js';
import type { IRaceEvent } from '../src/types/index';

const r = (date: string, name: string, source = ''): IRaceEvent => ({
  id: `${date}_${name}`,
  date,
  name,
  location: '',
  registrationLink: '',
  stravaFull: '',
  stravaHalf: '',
  gpxFull: '',
  gpxHalf: '',
  distances: '',
  regClose: '',
  source
});

const names = (list: IRaceEvent[]): string[] => list.map((x) => x.name);
const sources = (list: IRaceEvent[]): string[] => list.map((x) => x.source || '');

test('normalizeRaceName strips year / 第N屆 / punctuation, unifies 台→臺 and full-width', () => {
  assert.equal(
    normalizeRaceName('2026 VISOGE 夜跑派對-高雄場'),
    normalizeRaceName('VISOGE 夜跑派對 高雄場')
  );
  assert.equal(normalizeRaceName('台中場'), normalizeRaceName('臺中場'));
  assert.equal(normalizeRaceName('臺北馬拉松ＴＡＩＰＥＩ'), normalizeRaceName('臺北馬拉松TAIPEI'));
  assert.equal(normalizeRaceName('第二屆東石路跑'), normalizeRaceName('東石路跑'));
});

test('dedupePreferBiji merges cross-source variants and keeps biji', () => {
  const cases: [string, IRaceEvent, IRaceEvent][] = [
    // [label, mw-variant, biji-variant] on the same date
    [
      'dash/space',
      r('2026-07-04', '2026 VISOGE 夜跑派對 高雄場', 'marathonsworld'),
      r('2026-07-04', '2026 VISOGE 夜跑派對-高雄場', 'biji')
    ],
    [
      '台/臺',
      r('2026-07-18', '2026 VISOGE 夜跑派對 臺中場', 'marathonsworld'),
      r('2026-07-18', '2026 VISOGE 夜跑派對 台中場', 'biji')
    ],
    [
      'year prefix',
      r('2026-12-20', '2026 臺北馬拉松', 'marathonsworld'),
      r('2026-12-20', '臺北馬拉松', 'biji')
    ],
    [
      'subtitle suffix',
      r('2026-06-27', '第二屆東石仲夏星光路跑 × 海鮮星光盛典', 'marathonsworld'),
      r('2026-06-27', '第二屆東石仲夏星光路跑', 'biji')
    ],
    [
      'inserted 縣',
      r('2026-10-04', '宜蘭縣冬山河水岸馬拉松', 'marathonsworld'),
      r('2026-10-04', '宜蘭冬山河水岸馬拉松', 'biji')
    ]
  ];
  for (const [label, mw, biji] of cases) {
    // biji first, then mw
    const a = dedupePreferBiji([biji, mw]);
    assert.equal(a.length, 1, `${label}: biji-first should collapse to 1`);
    assert.equal(a[0].source, 'biji', `${label}: biji-first keeps biji`);
    // mw first, then biji → still resolves to biji
    const b = dedupePreferBiji([mw, biji]);
    assert.equal(b.length, 1, `${label}: mw-first should collapse to 1`);
    assert.equal(b[0].source, 'biji', `${label}: mw-first replaced by biji`);
  }
});

test('dedupePreferBiji does NOT merge different events (char substitution / different date)', () => {
  // Same series, same day, different venue — must stay separate (西湖 vs 苗栗).
  const diffVenue = dedupePreferBiji([
    r('2026-06-21', '2026全台PAPAGO歡樂跑--西湖場', 'biji'),
    r('2026-06-21', '2026 全台PAPAGO歡樂跑--苗栗場', 'marathonsworld')
  ]);
  assert.equal(diffVenue.length, 2);

  // Same name, different date — not the same event.
  const diffDate = dedupePreferBiji([
    r('2026-10-11', '蘆竹機捷馬拉松', 'biji'),
    r('2026-10-18', '蘆竹機捷馬拉松', 'marathonsworld')
  ]);
  assert.equal(diffDate.length, 2);
});

test('dedupePreferBiji preserves order and dedupes when no source preference applies', () => {
  const out = dedupePreferBiji([
    r('2026-08-01', 'A 馬拉松', ''),
    r('2026-08-02', 'B 路跑', ''),
    r('2026-08-01', 'A馬拉松', '') // same event as #1 (spacing) → collapse, keep first
  ]);
  assert.deepEqual(names(out), ['A 馬拉松', 'B 路跑']);
  assert.deepEqual(sources(out), ['', '']);
});
