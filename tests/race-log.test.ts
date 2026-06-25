import test from 'node:test';
import assert from 'node:assert/strict';

import RaceLog, { type IRaceEntry } from '../src/modules/core/RaceLog.js';

const e = (date: string, distanceMeters: number, timeSec: number): IRaceEntry => ({
  id: RaceLog.makeId({ date, distanceMeters, timeSec }),
  date,
  distanceMeters,
  timeSec
});

test('validate accepts well-formed entries and rejects bad ones', () => {
  assert.equal(RaceLog.validate(e('2026-01-01', 10000, 3000)), true);
  assert.equal(
    RaceLog.validate({ date: '2026/01/01', distanceMeters: 10000, timeSec: 3000 }),
    false
  );
  assert.equal(RaceLog.validate({ date: '2026-01-01', distanceMeters: 0, timeSec: 3000 }), false);
  assert.equal(RaceLog.validate({ date: '2026-01-01', distanceMeters: 10000, timeSec: 0 }), false);
  assert.equal(RaceLog.validate(null), false);
});

test('upsert adds, replaces identical id, and keeps date order', () => {
  let list: IRaceEntry[] = [];
  list = RaceLog.upsert(list, e('2026-03-01', 10000, 3000));
  list = RaceLog.upsert(list, e('2026-01-01', 5000, 1400));
  assert.equal(list.length, 2);
  assert.deepEqual(
    list.map((x) => x.date),
    ['2026-01-01', '2026-03-01']
  ); // sorted ascending
  // same date+distance+time → same id → replace, no duplicate
  list = RaceLog.upsert(list, e('2026-03-01', 10000, 3000));
  assert.equal(list.length, 2);
});

test('remove drops by id', () => {
  const a = e('2026-01-01', 5000, 1400);
  const list = RaceLog.remove([a], a.id);
  assert.equal(list.length, 0);
});

test('merge unions by id (cross-device, no loss, no dup)', () => {
  const a = [e('2026-01-01', 5000, 1400)];
  const b = [e('2026-01-01', 5000, 1400), e('2026-02-01', 10000, 3000)];
  const merged = RaceLog.merge(a, b);
  assert.equal(merged.length, 2);
});

test('analyze: VDOT trend in date order; PB is the best per distance', () => {
  const list = [
    e('2026-01-01', 10000, 50 * 60), // 10K 50:00
    e('2026-02-01', 10000, 48 * 60), // 10K 48:00 (faster → PB)
    e('2026-03-01', 5000, 22 * 60) // 5K
  ];
  const { vdotTrend, pbByDistance } = RaceLog.analyze(list);
  assert.equal(vdotTrend.length, 3);
  assert.deepEqual(
    vdotTrend.map((p) => p.date),
    ['2026-01-01', '2026-02-01', '2026-03-01']
  );
  assert.ok(vdotTrend.every((p) => p.vdot > 0));

  const pb10k = pbByDistance.find((p) => p.distanceMeters === 10000);
  assert.ok(pb10k);
  assert.equal(pb10k.entry.timeSec, 48 * 60); // faster run wins
  assert.equal(pb10k.paceSec, Math.round((48 * 60) / 10)); // 288 s/km
});
