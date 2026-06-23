/**
 * Running Pace Calculator — Cloudflare Worker backend
 *
 * Responsibilities:
 *  1. Race data API (a stable, you-own-it replacement for the GAS scraper):
 *       GET  /api/races          → public list (served from KV, edge-cached)
 *       PUT  /api/races          → replace list (admin only; JSON body)
 *       (scheduled) best-effort refresh — parses a JSON feed if one exists and
 *       merges it; otherwise logs (the sources are JS/SPA + login-walled, so
 *       admin curation via PUT remains the reliable path).
 *  2. Magic-link auth (passwordless, email via Resend).
 *  3. Per-user cloud sync (Bearer session): GET/PUT /api/data.
 *
 * Bindings: KV. Vars: APP_URL, ALLOWED_ORIGIN, FROM_EMAIL, ADMIN_EMAILS,
 * DEBUG_AUTH ("1" surfaces email-send result). Secret: RESEND_API_KEY.
 */

import {
  normalizeEmail,
  isValidEmail,
  corsAllowOrigin,
  buildMagicLinkUrl,
  tryParseRaces,
  mergeRaces
} from './lib.js';

const MAGIC_TTL_S = 900; // 15 min
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days
const RATE_TTL_S = 60; // 1 magic-link request per email per minute
const MW_URL = 'https://www.marathonsworld.com/artapp/racePage.php';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function corsHeaders(env, request) {
  return {
    'Access-Control-Allow-Origin': corsAllowOrigin(
      env.ALLOWED_ORIGIN || env.APP_URL,
      request.headers.get('Origin') || ''
    ),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(data, status, env, request, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      ...corsHeaders(env, request),
      ...(extraHeaders || {})
    }
  });
}

function randomId() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function getSessionEmail(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return env.KV.get(`session:${m[1]}`);
}

async function sendMagicEmail(env, email, link) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.log('[auth] RESEND_API_KEY / FROM_EMAIL not configured — cannot send email');
    return false;
  }
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL,
      to: email,
      subject: 'RunningPaceNote 登入連結 / Your login link',
      html:
        `<p>點此登入 RunningPaceNote（15 分鐘內有效）：</p>` +
        `<p><a href="${link}">${link}</a></p>` +
        `<p>Click to sign in (valid 15 min). 若非本人操作請忽略。</p>`
    })
  });
  if (!resp.ok) {
    console.log('[auth] Resend failed:', resp.status, await resp.text());
    return false;
  }
  return true;
}

// ── Route handlers ──────────────────────────────────────────────────────────

async function handleGetRaces(env, request) {
  const raw = await env.KV.get('races');
  const races = raw ? JSON.parse(raw) : [];
  return json(races, 200, env, request, { 'Cache-Control': 'public, max-age=300' });
}

async function handlePutRaces(env, request) {
  const email = await getSessionEmail(request, env);
  const admins = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
  if (!email || !admins.includes(email)) {
    return json({ error: 'forbidden' }, 403, env, request);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400, env, request);
  }
  if (!Array.isArray(body)) return json({ error: 'expected array' }, 400, env, request);
  await env.KV.put('races', JSON.stringify(body));
  return json({ ok: true, count: body.length }, 200, env, request);
}

async function handleAuthRequest(env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400, env, request);
  }
  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) return json({ error: 'invalid email' }, 400, env, request);

  const rlKey = `rl:${email}`;
  if (await env.KV.get(rlKey)) {
    return json({ error: 'rate_limited' }, 429, env, request);
  }
  await env.KV.put(rlKey, '1', { expirationTtl: RATE_TTL_S });

  const token = randomId();
  await env.KV.put(`magic:${token}`, email, { expirationTtl: MAGIC_TTL_S });

  const link = buildMagicLinkUrl(env.APP_URL || '', token);
  const sent = await sendMagicEmail(env, email, link);

  // Surface the real send result only when explicitly debugging; otherwise 200
  // regardless (so we never leak whether an address exists).
  const payload = env.DEBUG_AUTH === '1' ? { ok: true, sent } : { ok: true };
  return json(payload, 200, env, request);
}

async function handleAuthVerify(env, request, url) {
  const token = url.searchParams.get('token');
  if (!token) return json({ error: 'missing token' }, 400, env, request);
  const email = await env.KV.get(`magic:${token}`);
  if (!email) return json({ error: 'invalid_or_expired' }, 401, env, request);

  await env.KV.delete(`magic:${token}`); // single use
  const sid = randomId();
  await env.KV.put(`session:${sid}`, email, { expirationTtl: SESSION_TTL_S });
  return json({ token: sid, email }, 200, env, request);
}

async function handleAuthLogout(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (m) await env.KV.delete(`session:${m[1]}`);
  return json({ ok: true }, 200, env, request);
}

async function handleGetData(env, request) {
  const email = await getSessionEmail(request, env);
  if (!email) return json({ error: 'unauthorized' }, 401, env, request);
  const raw = await env.KV.get(`user:${email}`);
  return json(raw ? JSON.parse(raw) : {}, 200, env, request);
}

async function handlePutData(env, request) {
  const email = await getSessionEmail(request, env);
  if (!email) return json({ error: 'unauthorized' }, 401, env, request);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400, env, request);
  }
  if (!body || typeof body !== 'object')
    return json({ error: 'expected object' }, 400, env, request);
  await env.KV.put(`user:${email}`, JSON.stringify(body));
  return json({ ok: true }, 200, env, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    try {
      if (pathname === '/api/races' && request.method === 'GET')
        return handleGetRaces(env, request);
      if (pathname === '/api/races' && request.method === 'PUT')
        return handlePutRaces(env, request);
      if (pathname === '/api/auth/request' && request.method === 'POST')
        return handleAuthRequest(env, request);
      if (pathname === '/api/auth/verify' && request.method === 'GET')
        return handleAuthVerify(env, request, url);
      if (pathname === '/api/auth/logout' && request.method === 'POST')
        return handleAuthLogout(env, request);
      if (pathname === '/api/data' && request.method === 'GET') return handleGetData(env, request);
      if (pathname === '/api/data' && request.method === 'PUT') return handlePutData(env, request);
      return json({ error: 'not_found' }, 404, env, request);
    } catch (err) {
      console.log('[worker] error:', err && err.stack ? err.stack : String(err));
      return json({ error: 'internal' }, 500, env, request);
    }
  },

  /** Best-effort scheduled race refresh: parse a JSON feed if present, merge it. */
  async scheduled(event, env) {
    try {
      const resp = await fetch(MW_URL, {
        method: 'POST',
        headers: { 'User-Agent': UA },
        body: new URLSearchParams({
          action: 'getRaceListByCountryYear',
          user_id: '1',
          country: '1',
          year: '0',
          sort: '0',
          type: '0'
        })
      });
      const text = await resp.text();
      console.log('[cron] marathonsworld status', resp.status, 'bytes', text.length);

      const fresh = tryParseRaces(text);
      if (!fresh.length) {
        console.log('[cron] no parseable races (source likely JS/SPA) — use PUT /api/races');
        return;
      }
      const raw = await env.KV.get('races');
      const { list, added } = mergeRaces(raw ? JSON.parse(raw) : [], fresh);
      if (added > 0) await env.KV.put('races', JSON.stringify(list));
      console.log('[cron] merged', added, 'new races');
    } catch (err) {
      console.log('[cron] refresh error:', String(err));
    }
  }
};
