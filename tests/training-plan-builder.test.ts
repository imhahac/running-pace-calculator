import test from 'node:test';
import assert from 'node:assert/strict';

import TrainingPlanBuilder, {
  type ITrainingPlanContext
} from '../src/modules/core/TrainingPlanBuilder.js';
import {
  FULL_MARATHON_METERS,
  HALF_MARATHON_METERS,
  TRAINING_PLAN
} from '../src/constants/index.js';

const translate = (k: string): string => `<${k}>`;
const workoutTextMap = { easy: 'W_easy', tempo: 'W_tempo', interval: 'W_interval', race: 'W_race' };
const CJK = /[一-鿿]/;

function ctx(overrides: Partial<ITrainingPlanContext> = {}): ITrainingPlanContext {
  return {
    paceSecondsPerKm: 300,
    weekCount: 12,
    raceScale: 1,
    planDistanceMeters: FULL_MARATHON_METERS,
    isTriathlon: false,
    translate,
    workoutTextMap,
    ...overrides
  };
}

test('resolveRaceScale buckets by goal distance', () => {
  assert.equal(
    TrainingPlanBuilder.resolveRaceScale(FULL_MARATHON_METERS),
    TRAINING_PLAN.raceScale.long
  );
  assert.equal(TrainingPlanBuilder.resolveRaceScale(226000), TRAINING_PLAN.raceScale.long);
  assert.equal(
    TrainingPlanBuilder.resolveRaceScale(HALF_MARATHON_METERS),
    TRAINING_PLAN.raceScale.mid
  );
  assert.equal(TrainingPlanBuilder.resolveRaceScale(113000), TRAINING_PLAN.raceScale.mid);
  assert.equal(TrainingPlanBuilder.resolveRaceScale(10000), TRAINING_PLAN.raceScale.short);
});

test('phaseForWeek maps weeks to periodization phases', () => {
  assert.equal(TrainingPlanBuilder.phaseForWeek(1, 1), 'race');
  const wc = 16;
  assert.equal(TrainingPlanBuilder.phaseForWeek(wc, wc), 'race'); // last week
  assert.equal(TrainingPlanBuilder.phaseForWeek(wc - 1, wc), 'taper'); // >= wc-1
  assert.equal(TrainingPlanBuilder.phaseForWeek(wc - 3, wc), 'peak'); // >= wc-4
  assert.equal(TrainingPlanBuilder.phaseForWeek(wc - 6, wc), 'build'); // >= wc-8
  assert.equal(TrainingPlanBuilder.phaseForWeek(1, wc), 'base');
});

test('buildMileage: triathlon carries less running volume', () => {
  const run = TrainingPlanBuilder.buildMileage(5, 'build', ctx({ isTriathlon: false }));
  const tri = TrainingPlanBuilder.buildMileage(5, 'build', ctx({ isTriathlon: true }));
  assert.ok(tri.mileage < run.mileage);
});

test('buildMileage: every 4th week is recovery outside taper/race', () => {
  assert.equal(TrainingPlanBuilder.buildMileage(4, 'build', ctx()).isRecovery, true);
  assert.equal(TrainingPlanBuilder.buildMileage(5, 'build', ctx()).isRecovery, false);
  assert.equal(TrainingPlanBuilder.buildMileage(4, 'taper', ctx()).isRecovery, false);
  assert.equal(TrainingPlanBuilder.buildMileage(4, 'race', ctx()).isRecovery, false);
});

test('buildMileage respects per-phase floors', () => {
  const m = TrainingPlanBuilder.buildMileage(
    1,
    'race',
    ctx({ paceSecondsPerKm: 600, raceScale: TRAINING_PLAN.raceScale.short })
  );
  assert.ok(m.mileage >= TRAINING_PLAN.phaseVolume.race.floorKm);
});

test('paceByPhase returns finite paces; easy is slower than interval', () => {
  const p = TrainingPlanBuilder.paceByPhase('peak', 300);
  assert.ok(p.easy > p.interval); // larger sec/km => slower
  assert.ok(Number.isFinite(p.tempo) && Number.isFinite(p.long));
});

test('workoutDesc produces structured, fully-localized stages (no hardcoded CJK)', () => {
  const p = TrainingPlanBuilder.paceByPhase('build', 300);
  const types = ['long', 'interval', 'tempo'] as const;
  for (const type of types) {
    const info = TrainingPlanBuilder.workoutDesc(type, p, ctx());
    const stages = info.stages ?? [];
    assert.equal(stages.length, 3, `${type} has 3 stages`);
    assert.ok(!CJK.test(JSON.stringify(info)), `${type} leaks no CJK when translate returns keys`);
  }
  const interval = TrainingPlanBuilder.workoutDesc('interval', p, ctx());
  assert.ok((interval.stages ?? []).some((s) => s.isHighlight === true));
});

test('workoutDesc handles rest/swim/bike branches', () => {
  const p = TrainingPlanBuilder.paceByPhase('base', 300);
  assert.equal(TrainingPlanBuilder.workoutDesc('rest', p, ctx()).pace, '-');
  const swim = TrainingPlanBuilder.workoutDesc(
    'swim',
    p,
    ctx({ isTriathlon: true, planDistanceMeters: 113000 })
  );
  assert.equal(swim.desc, '<workout_swim>');
  const bike = TrainingPlanBuilder.workoutDesc(
    'bike',
    p,
    ctx({ isTriathlon: true, planDistanceMeters: 226000 })
  );
  assert.equal(bike.pace, 'Zone 2');
});

test('dayLabel maps 0..6 to localized weekday keys', () => {
  assert.equal(TrainingPlanBuilder.dayLabel(0, translate), '<day_mon>');
  assert.equal(TrainingPlanBuilder.dayLabel(6, translate), '<day_sun>');
});
