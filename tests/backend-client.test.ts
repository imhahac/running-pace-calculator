import test from 'node:test';
import assert from 'node:assert/strict';

import BackendClient from '../src/modules/state/BackendClient.js';
import StateManager from '../src/modules/state/StateManager.js';

test('isConfigured + racesUrl derive from the backend URL (trailing slash stripped)', () => {
  StateManager.setBackendUrl('');
  assert.equal(BackendClient.isConfigured(), false);
  assert.equal(BackendClient.racesUrl(), '');

  StateManager.setBackendUrl('https://x.workers.dev/');
  assert.equal(BackendClient.isConfigured(), true);
  assert.equal(BackendClient.racesUrl(), 'https://x.workers.dev/api/races');

  StateManager.setBackendUrl(''); // restore
});

test('session helpers read localStorage', () => {
  const g = globalThis as unknown as Record<string, unknown>;
  const orig = g.localStorage;
  const store: Record<string, string> = {};
  g.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    }
  };
  try {
    assert.equal(BackendClient.isLoggedIn(), false);
    store['rpc_session'] = 'abc';
    store['rpc_session_email'] = 'a@b.com';
    assert.equal(BackendClient.isLoggedIn(), true);
    assert.equal(BackendClient.getEmail(), 'a@b.com');
  } finally {
    g.localStorage = orig;
  }
});

test('network calls no-op (resolve falsy) when no backend configured', async () => {
  StateManager.setBackendUrl('');
  assert.equal(await BackendClient.requestMagicLink('a@b.com'), false);
  assert.equal(await BackendClient.verify('tok'), null);
  assert.equal(await BackendClient.putData({ x: 1 }), false);
});
