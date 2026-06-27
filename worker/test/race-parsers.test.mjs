import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { parseMwRaces, parseBijiRaces, mergeRaces } from '../src/lib.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

test('parseMwRaces: parses rows, tracks year across YYYY年M月 headers, cleans name', () => {
  const races = parseMwRaces(fixture('mw-racelist.html'));
  assert.equal(races.length, 3);

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
  assert.equal(list.length, 5); // 3 + 2, no overlap
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
