import test from 'node:test';
import assert from 'node:assert/strict';

import TimeFormatter from '../src/modules/core/TimeFormatter.js';

test('format pads and switches to h:mm:ss at the hour boundary', () => {
  assert.equal(TimeFormatter.format(59), '00:59');
  assert.equal(TimeFormatter.format(3599), '59:59');
  assert.equal(TimeFormatter.format(3600), '1:00:00');
  assert.equal(TimeFormatter.format(0), '00:00');
  assert.equal(TimeFormatter.format(90, true), '0:01:30');
});

test('format rejects invalid numbers', () => {
  assert.equal(TimeFormatter.format(-1), '');
  assert.equal(TimeFormatter.format(NaN), '');
  assert.equal(TimeFormatter.format(Infinity), '');
});

test('parse returns 0 for empty/invalid (legacy behavior preserved)', () => {
  assert.equal(TimeFormatter.parse(''), 0);
  assert.equal(TimeFormatter.parse('abc'), 0);
  assert.equal(TimeFormatter.parse('1:60'), 0); // seconds overflow
  assert.equal(TimeFormatter.parse('1:00:60'), 0);
});

test('parse handles valid m:ss, h:mm:ss and bare seconds', () => {
  assert.equal(TimeFormatter.parse('00:59'), 59);
  assert.equal(TimeFormatter.parse('59:59'), 3599);
  assert.equal(TimeFormatter.parse('1:00:00'), 3600);
  assert.equal(TimeFormatter.parse('90'), 90);
});

test('tryParse distinguishes invalid input from a genuine zero', () => {
  assert.equal(TimeFormatter.tryParse(''), null);
  assert.equal(TimeFormatter.tryParse(null), null);
  assert.equal(TimeFormatter.tryParse(undefined), null);
  assert.equal(TimeFormatter.tryParse('abc'), null);
  assert.equal(TimeFormatter.tryParse('1:60'), null);
  assert.equal(TimeFormatter.tryParse('1:2:3:4'), null); // too many parts
  assert.equal(TimeFormatter.tryParse('0'), 0); // genuine zero
  assert.equal(TimeFormatter.tryParse('00:00'), 0);
  assert.equal(TimeFormatter.tryParse('5:00'), 300);
  assert.equal(TimeFormatter.tryParse('1:00:00'), 3600);
});

test('validate / isValidTime predicates', () => {
  assert.equal(TimeFormatter.validate('3:30:00'), true);
  assert.equal(TimeFormatter.validate('20:00'), true);
  assert.equal(TimeFormatter.validate('nope'), false);
  assert.equal(TimeFormatter.isValidTime('20:00'), true);
  assert.equal(TimeFormatter.isValidTime(''), false);
});

test('format/parse round-trips representative times', () => {
  for (const s of [0, 59, 60, 599, 3600, 3661]) {
    const str = TimeFormatter.format(s, true);
    assert.equal(TimeFormatter.parse(str), s);
  }
});
