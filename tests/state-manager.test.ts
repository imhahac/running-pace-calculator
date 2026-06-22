import test from 'node:test';
import assert from 'node:assert/strict';

import StateManager from '../src/modules/state/StateManager.js';
import StorageManager from '../src/modules/state/StorageManager.js';

test('StateManager subscribe notifies listeners and unsubscribe stops them', () => {
  const calls: string[] = [];
  const unsubscribeA = StateManager.subscribe(() => calls.push('a'));
  const unsubscribeB = StateManager.subscribe(() => calls.push('b'));

  StateManager.setMode('track');
  assert.deepEqual(calls, ['a', 'b']);

  calls.length = 0;
  unsubscribeA();
  StateManager.setMode('treadmill');
  assert.deepEqual(calls, ['b']);

  unsubscribeB();
});

test('StateManager persists theme and language preferences', () => {
  StorageManager.clear();

  StateManager.setTheme('dark');
  StateManager.setLanguage('en');

  assert.equal(StorageManager.loadTheme(), 'dark');
  assert.equal(StorageManager.loadLanguage(), 'en');

  StorageManager.clear();
});
