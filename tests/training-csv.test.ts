import test from 'node:test';
import assert from 'node:assert/strict';

import Calculator from '../src/modules/core/Calculator.js';
import TrainingCycleManager from '../src/modules/ui/TrainingCycleManager.js';

function samplePlan() {
  const date = new Date();
  date.setDate(date.getDate() + 35);
  const iso = date.toISOString().slice(0, 10);
  const map = { base: 'base', build: 'build', peak: 'peak', taper: 'taper', race: 'race' };
  const work = { easy: 'easy', tempo: 'tempo', interval: 'interval', race: 'race' };
  return Calculator.generateTrainingCycle(300, iso, map, work, 42195, false, (k) => k);
}

test('planToCsv: header + one row per day, every field quoted', () => {
  const plan = samplePlan();
  const csv = TrainingCycleManager.planToCsv(plan);
  const lines = csv.split('\n');
  const dayCount = plan.reduce((n, w) => n + w.days.length, 0);

  assert.equal(lines.length, dayCount + 1); // + header
  // Every line is fully quoted, so commas inside pace text never break columns.
  assert.ok(lines.every((l) => l.startsWith('"') && l.endsWith('"')));
  assert.ok(csv.includes('"W1"'));
});

test('planToCsv: empty plan yields just the header', () => {
  const csv = TrainingCycleManager.planToCsv([]);
  assert.equal(csv.split('\n').length, 1);
});
