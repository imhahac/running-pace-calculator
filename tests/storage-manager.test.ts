import test from 'node:test';
import assert from 'node:assert/strict';

import StorageManager from '../src/modules/state/StorageManager.js';
import { STORAGE_KEY } from '../src/constants/index.js';
import type { IPaceState } from '../src/types/index';

// Node has no localStorage, so StorageManager runs on its in-memory fallback.
// These tests exercise that path end to end.

test('saveState/loadState round-trips state and inputs', () => {
  StorageManager.clear();
  StorageManager.set(STORAGE_KEY, '');
  assert.equal(StorageManager.loadState(), null);

  const state = { mode: 'track', lane: 408 } as Partial<IPaceState> as IPaceState;
  const inputs = { pace_input: '4', pace_sec_input: '30' };
  StorageManager.saveState(state, inputs);

  const loaded = StorageManager.loadState();
  assert.ok(loaded);
  assert.equal(loaded?.state.mode, 'track');
  assert.equal(loaded?.inputs.pace_input, '4');
  StorageManager.clear();
});

test('loadState returns null on corrupt JSON', () => {
  StorageManager.set(STORAGE_KEY, '{not valid json');
  assert.equal(StorageManager.loadState(), null);
  StorageManager.clear();
});

test('loadState tolerates missing state/inputs fields', () => {
  StorageManager.set(STORAGE_KEY, JSON.stringify({ foo: 1 }));
  const loaded = StorageManager.loadState();
  assert.ok(loaded);
  assert.deepEqual(loaded?.state, {});
  assert.deepEqual(loaded?.inputs, {});
  StorageManager.clear();
});

test('theme and language persist and validate stored values', () => {
  StorageManager.clear();
  assert.equal(StorageManager.loadTheme(), null);

  StorageManager.saveTheme('dark');
  assert.equal(StorageManager.loadTheme(), 'dark');

  StorageManager.set('theme', 'banana'); // invalid → treated as missing
  assert.equal(StorageManager.loadTheme(), null);

  StorageManager.saveLanguage('en');
  assert.equal(StorageManager.loadLanguage(), 'en');
  StorageManager.clear();
});

test('get/set expose raw key access', () => {
  StorageManager.set('arbitrary_key', 'value');
  assert.equal(StorageManager.get('arbitrary_key'), 'value');
});

// Underpins the offline-sync pending flag (SyncController PENDING_KEY): set on a
// failed push, cleared on a successful resend.
test('remove clears a single key; absent-key remove is a safe no-op', () => {
  const KEY = 'rpc_pending_sync';
  StorageManager.set(KEY, '1');
  assert.equal(StorageManager.get(KEY), '1');

  StorageManager.remove(KEY);
  assert.equal(StorageManager.get(KEY), null);

  StorageManager.remove(KEY); // no throw on absent key
  assert.equal(StorageManager.get(KEY), null);
});
