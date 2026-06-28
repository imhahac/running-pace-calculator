import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  parseMwRaces,
  parseBijiRaces,
  mergeRaces,
  pruneExpiredRaces,
  overLimit
} from '../src/lib.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('parseMwRaces: parses rows, tracks year across YYYY年M月 headers, cleans name', () => {
  const races = parseMwRaces(fixture('mw-racelist.html'));
  // 3 rows in the fixture, but the 不限地點 virtual challenge (rid=24261) is dropped.
  assert.equal(races.length, 2);
  assert.ok(!races.some((r) => r.registrationLink.endsWith('rid=24261')));

  const taipingshan = races.find((r) => r.registrationLink.endsWith('rid=23897'));
  assert.ok(taipingshan);
  assert.equal(taipingshan.date, '2026-06-06');
  assert.equal(taipingshan.name, '2026 太平山雲端漫步活動'); // leading '*' and <img> stripped
  assert.equal(taipingshan.location, '宜蘭縣大同鄉太平山莊廣場');
  assert.equal(
    taipingshan.registrationLink,
    'https://www.marathonsworld.com/artapp/racedetail.php?rid=23897'
  );
  assert.equal(taipingshan.distances, '全馬 | 半馬'); // 組別 cell
  assert.equal(taipingshan.source, 'marathonsworld');

  // Year flips to 2027 once the 2027年1月 header is seen.
  const newYear = races.find((r) => r.registrationLink.endsWith('rid=25000'));
  assert.equal(newYear.date, '2027-01-03');
  assert.equal(newYear.name, '2027 新年馬拉松');

  assert.ok(races.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date)));
});

test('parseMwRaces: non-matching / empty input → []', () => {
  assert.deepEqual(parseMwRaces('<html>no races here</html>'), []);
  assert.deepEqual(parseMwRaces(''), []);
  assert.deepEqual(parseMwRaces(null), []);
});

test('parseMwRaces: skips 不限地點 virtual challenges (zodiac series), keeps real races', () => {
  const html =
    '2026年7月' +
    "<tr class='ColorBar9'><td>07/05(日)</td>" +
    "<td><a href='racedetail.php?rid=100' class='FontV1-BlackS'>真實馬拉松</a></td>" +
    "<td width='150'>臺北市</td><td width='130'>全馬 | 半馬</td></tr>" +
    "<tr class='ColorBar11'><td>07/11(六)</td>" +
    "<td><a href='racedetail.php?rid=24353' class='FontV1-BlackS'>2026-7月巨蟹座 Cancer (07/10~19)</a></td>" +
    "<td width='150'>不限地點</td><td width='130'>全馬 | 半馬</td></tr>";
  const races = parseMwRaces(html);
  assert.equal(races.length, 1);
  assert.equal(races[0].name, '真實馬拉松');
  assert.equal(races[0].location, '臺北市');
  assert.ok(!races.some((r) => /巨蟹座/.test(r.name)));
});

test('parseBijiRaces: full date from calendar dates=, place + cid link', () => {
  const races = parseBijiRaces(fixture('biji.html'));
  assert.equal(races.length, 2);
  assert.deepEqual(
    races.map((r) => r.date),
    ['2026-06-21', '2026-06-27']
  );
  assert.equal(races[0].name, '2026全台PAPAGO歡樂跑--西湖場');
  assert.equal(races[0].location, '苗栗縣');
  assert.match(
    races[0].registrationLink,
    /^https:\/\/running\.biji\.co\/index\.php\?q=competition&act=info&cid=12919/
  );
  assert.equal(races[1].name, 'TOYOTA RUN 高雄 樂齡專場');
  assert.equal(races[1].location, '高雄市');
  assert.equal(races[0].distances, '42.2K, 22.24K'); // from event-item divs
  assert.equal(races[1].distances, '10K');
  assert.equal(races[0].source, 'biji');
  assert.equal(races[0].regClose, '2026-05-30'); // registration close from 報名日期
  assert.equal(races[1].regClose, ''); // no 報名日期 in this block
});

test('parseBijiRaces: non-matching / empty input → []', () => {
  assert.deepEqual(parseBijiRaces('<html>nothing</html>'), []);
  assert.deepEqual(parseBijiRaces(''), []);
});

test('crawled races from both sources merge with dedupe (date_name)', () => {
  const mw = parseMwRaces(fixture('mw-racelist.html'));
  const biji = parseBijiRaces(fixture('biji.html'));
  let { list } = mergeRaces([], mw);
  ({ list } = mergeRaces(list, biji));
  assert.equal(list.length, 4); // 2 MW (不限地點 dropped) + 2 biji, no overlap
  // Re-merging the same sources adds nothing.
  const { added } = mergeRaces(list, [...mw, ...biji]);
  assert.equal(added, 0);
});

test('mergeRaces backfills empty fields on existing entries without overwriting', () => {
  // Existing entry lacks distances/source but has an admin-entered gpxFull.
  const existing = [
    {
      id: '',
      date: '2026-06-06',
      name: 'X',
      location: '',
      distances: '',
      source: '',
      registrationLink: '',
      stravaFull: '',
      stravaHalf: '',
      gpxFull: 'admin.gpx',
      gpxHalf: ''
    }
  ];
  const fresh = [
    {
      id: '',
      date: '2026-06-06',
      name: 'X',
      location: '宜蘭縣',
      distances: '全馬 | 半馬',
      source: 'marathonsworld',
      registrationLink: 'https://example/r',
      stravaFull: '',
      stravaHalf: '',
      gpxFull: 'crawler.gpx',
      gpxHalf: ''
    }
  ];
  const { list, added } = mergeRaces(existing, fresh);
  assert.equal(added, 0); // same date_name → not a new row
  assert.equal(list[0].distances, '全馬 | 半馬'); // empty → backfilled
  assert.equal(list[0].source, 'marathonsworld');
  assert.equal(list[0].location, '宜蘭縣');
  assert.equal(list[0].gpxFull, 'admin.gpx'); // non-empty → preserved
});

test('pruneExpiredRaces drops races before cutoff, keeps cutoff/future/undated', () => {
  const races = [
    { date: '2026-06-01', name: 'past' }, // before cutoff → drop
    { date: '2026-06-10', name: 'cutoff' }, // == cutoff → keep
    { date: '2026-12-31', name: 'future' }, // after → keep
    { date: '', name: 'no-date' }, // empty → keep (unclassifiable)
    { date: 'not a date', name: 'bad-date' } // unparseable → keep
  ];
  const { list, removed } = pruneExpiredRaces(races, '2026-06-10');
  assert.equal(removed, 1);
  assert.deepEqual(
    list.map((r) => r.name),
    ['cutoff', 'future', 'no-date', 'bad-date']
  );
});

test('pruneExpiredRaces tolerates non-array input', () => {
  assert.deepEqual(pruneExpiredRaces(null, '2026-06-10'), { list: [], removed: 0 });
  assert.deepEqual(pruneExpiredRaces(undefined, '2026-06-10'), { list: [], removed: 0 });
});

test('overLimit: counts at/above max are limited; null/blank treated as 0', () => {
  assert.equal(overLimit(null, 10), false);
  assert.equal(overLimit('0', 10), false);
  assert.equal(overLimit('9', 10), false);
  assert.equal(overLimit('10', 10), true);
  assert.equal(overLimit('11', 10), true);
  assert.equal(overLimit('', 1), false);
  assert.equal(overLimit('garbage', 1), false); // unparseable → 0
});
