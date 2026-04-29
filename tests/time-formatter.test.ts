import test from 'node:test';
import assert from 'node:assert/strict';

import TimeFormatter from '../src/modules/TimeFormatter.js';

test('parse supports m:s and h:m:s', () => {
  assert.equal(TimeFormatter.parse('20:00'), 1200);
  assert.equal(TimeFormatter.parse('3:30:00'), 12600);
});

test('format supports mm:ss and h:mm:ss', () => {
  assert.equal(TimeFormatter.format(245), '04:05');
  assert.equal(TimeFormatter.format(12600), '3:30:00');
});

test('validate accepts m:s and h:m:s', () => {
  assert.equal(TimeFormatter.validate('5:30'), true);
  assert.equal(TimeFormatter.validate('1:05:30'), true);
  assert.equal(TimeFormatter.validate('abc'), false);
});
