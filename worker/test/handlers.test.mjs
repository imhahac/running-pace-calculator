import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import worker from '../src/index.js';
import { sha256Hex } from '../src/lib.js';

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

// In-memory KV stub honouring expirationTtl (mirrors the bits the Worker uses).
function makeKV() {
  const store = new Map();
  return {
    store,
    async get(k) {
      const e = store.get(k);
      if (!e) return null;
      if (e.exp && e.exp < Date.now()) {
        store.delete(k);
        return null;
      }
      return e.v;
    },
    async put(k, v, opts) {
      store.set(k, { v, exp: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : 0 });
    },
    async delete(k) {
      store.delete(k);
    }
  };
}

function makeEnv(overrides = {}) {
  return {
    KV: makeKV(),
    APP_URL: 'https://app.test/',
    ALLOWED_ORIGIN: 'https://app.test',
    FROM_EMAIL: '', // empty → sendMagicEmail short-circuits (no network in tests)
    SENDGRID_API_KEY: '',
    ADMIN_EMAILS: 'admin@test.com',
    ...overrides
  };
}

const req = (method, path, { body, token } = {}) =>
  new Request(`https://app.test${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://app.test',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)
  });

test('GET /api/races tolerates corrupt KV (returns [])', async () => {
  const env = makeEnv();
  await env.KV.put('races', '{ not json');
  const res = await worker.fetch(req('GET', '/api/races'), env);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), []);
});

test('PUT /api/races: admin + valid → 200; bad shape → 400; non-admin → 403', async () => {
  const env = makeEnv();
  await env.KV.put('session:admintok', 'admin@test.com');
  await env.KV.put('session:usertok', 'user@test.com');

  const good = await worker.fetch(
    req('PUT', '/api/races', { token: 'admintok', body: [{ date: '2026-01-01', name: 'X' }] }),
    env
  );
  assert.equal(good.status, 200);
  assert.equal((await good.json()).count, 1);

  const bad = await worker.fetch(
    req('PUT', '/api/races', { token: 'admintok', body: [{ name: 'no date' }] }),
    env
  );
  assert.equal(bad.status, 400);

  const forbidden = await worker.fetch(
    req('PUT', '/api/races', { token: 'usertok', body: [{ date: '2026-01-01', name: 'X' }] }),
    env
  );
  assert.equal(forbidden.status, 403);
});

test('PUT /api/data: caps oversize blob (413), stores normal (200), needs auth (401)', async () => {
  const env = makeEnv();
  await env.KV.put('session:sid', 'user@test.com');

  const noauth = await worker.fetch(req('PUT', '/api/data', { body: { a: 1 } }), env);
  assert.equal(noauth.status, 401);

  const ok = await worker.fetch(req('PUT', '/api/data', { token: 'sid', body: { a: 1 } }), env);
  assert.equal(ok.status, 200);
  assert.equal(await env.KV.get('user:user@test.com'), '{"a":1}');

  const huge = JSON.stringify({ blob: 'x'.repeat(101 * 1024) });
  const tooBig = await worker.fetch(req('PUT', '/api/data', { token: 'sid', body: huge }), env);
  assert.equal(tooBig.status, 413);
});

test('auth: request rate-limited per email; verify is hash-matched + single-use', async () => {
  const env = makeEnv();

  const first = await worker.fetch(
    req('POST', '/api/auth/request', { body: { email: 'u@test.com' } }),
    env
  );
  assert.equal(first.status, 200);
  // A hashed magic key was stored (never the raw token).
  const magicKeys = [...env.KV.store.keys()].filter((k) => k.startsWith('magic:'));
  assert.equal(magicKeys.length, 1);

  const second = await worker.fetch(
    req('POST', '/api/auth/request', { body: { email: 'u@test.com' } }),
    env
  );
  assert.equal(second.status, 429); // 1 per minute

  // Seed a known token (hashed) and verify the round-trip.
  await env.KV.put(`magic:${await sha256Hex('tok')}`, 'v@test.com', { expirationTtl: 900 });
  const verify = await worker.fetch(req('GET', '/api/auth/verify?token=tok'), env);
  assert.equal(verify.status, 200);
  const { token: sid, email } = await verify.json();
  assert.equal(email, 'v@test.com');
  assert.ok(sid && (await env.KV.get(`session:${sid}`)) === 'v@test.com');

  // Single-use: same token now fails.
  const again = await worker.fetch(req('GET', '/api/auth/verify?token=tok'), env);
  assert.equal(again.status, 401);

  const bad = await worker.fetch(req('GET', '/api/auth/verify?token=nope'), env);
  assert.equal(bad.status, 401);
});

test('POST /api/races/refresh: admin-gated; on-demand crawl (stubbed) populates KV', async () => {
  const env = makeEnv();
  await env.KV.put('session:admintok', 'admin@test.com');
  await env.KV.put('session:usertok', 'user@test.com');

  // Rejected before any crawl runs.
  assert.equal(
    (await worker.fetch(req('POST', '/api/races/refresh', { token: 'usertok' }), env)).status,
    403
  );
  assert.equal((await worker.fetch(req('POST', '/api/races/refresh'), env)).status, 403);

  // Stub the source fetches with the committed fixtures.
  const origFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const u = String(url);
    const body = u.includes('running.biji.co')
      ? fixture('biji.html')
      : u.includes('marathonsworld.com')
        ? fixture('mw-racelist.html')
        : '';
    return new Response(body, { status: 200 });
  };
  try {
    const res = await worker.fetch(req('POST', '/api/races/refresh', { token: 'admintok' }), env);
    assert.equal(res.status, 200);
    const out = await res.json();
    assert.equal(out.ok, true);
    assert.equal(out.sources.biji.fetched, 2);
    assert.equal(out.sources.marathonsworld.fetched, 3);
    assert.equal(out.added, 5); // 2 + 3, no overlap
    assert.equal(JSON.parse(await env.KV.get('races')).length, 5);
  } finally {
    globalThis.fetch = origFetch;
  }
});
