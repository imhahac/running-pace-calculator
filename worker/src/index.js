/**
 * Running Pace Calculator — Cloudflare Worker backend
 *
 * Responsibilities:
 *  1. Race data API (a stable, you-own-it replacement for the GAS scraper):
 *       GET  /api/races          → public list (served from KV, edge-cached)
 *       PUT  /api/races          → replace list (admin only; JSON body)
 *       (scheduled) daily multi-source crawl — fetches 運動筆記 (biji.co) and
 *       馬拉松世界 (marathonsworld), parses each to IRaceEvent[] and append-only
 *       merges them into KV (deduped by date+name; never overwrites admin PUT
 *       entries' Strava/GPX). Each source is best-effort and isolated.
 *  2. Magic-link auth (passwordless, email via SendGrid).
 *  3. Per-user cloud sync (Bearer session): GET/PUT /api/data.
 *
 * Bindings: KV. Vars: APP_URL, ALLOWED_ORIGIN, FROM_EMAIL, ADMIN_EMAILS,
 * DEBUG_AUTH ("1" surfaces email-send result). Secret: SENDGRID_API_KEY.
 */

import {
  normalizeEmail,
  isValidEmail,
  corsAllowOrigin,
  buildMagicLinkUrl,
  parseMwRaces,
  parseBijiRaces,
  mergeRaces,
  pruneExpiredRaces,
  safeParseArray,
  validateRaces,
  sha256Hex
} from './lib.js';

const MAGIC_TTL_S = 900; // 15 min
const SESSION_TTL_S = 60 * 60 * 24 * 30; // 30 days
const RATE_TTL_S = 60; // 1 magic-link request per email per minute
const MAX_DATA_BYTES = 100 * 1024; // per-user sync blob cap (DoS / KV-quota guard)
// Race sources (see scheduled()). marathonsworld's racePage.php returns the full
// list to a plain POST (no session cookie needed — confirmed); biji.co's
// ?q=competition page is server-rendered HTML.
const MW_API_URL = 'https://www.marathonsworld.com/artapp/racePage.php';
const MW_RACELIST_URL = 'https://www.marathonsworld.com/artapp/racelist.php?p=1';
const MW_BODY = 'action=getRaceListByCountryYear&user_id=1&country=1&year=0&sort=0&type=0';
const BIJI_URL = 'https://running.biji.co/?q=competition';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Expired-race cleanup: drop races more than PRUNE_GRACE_DAYS past (a finished
// race lingers a week so users can still look it up), computed in Asia/Taipei
// since the races are Taiwan events (Worker runs UTC; Taiwan = UTC+8, no DST).
const PRUNE_GRACE_DAYS = 7;
function raceCutoffISO() {
  const ms = Date.now() + 8 * 3600 * 1000 - PRUNE_GRACE_DAYS * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function corsHeaders(env, request) {
  return {
    'Access-Control-Allow-Origin': corsAllowOrigin(
      env.ALLOWED_ORIGIN || env.APP_URL,
      request.headers.get('Origin') || ''
    ),
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'X-Races-Updated',
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
  if (!env.SENDGRID_API_KEY || !env.FROM_EMAIL) {
    console.log('[auth] SENDGRID_API_KEY / FROM_EMAIL not configured — cannot send email');
    return false;
  }
  const html =
    `<p>點此登入 RunningPaceNote（15 分鐘內有效）：</p>` +
    `<p><a href="${link}">${link}</a></p>` +
    `<p>Click to sign in (valid 15 min). 若非本人操作請忽略。</p>`;
  // SendGrid v3 Mail Send API. FROM_EMAIL must be an address on a SendGrid
  // authenticated domain (recommended — DKIM/SPF, better deliverability) or a
  // verified Single Sender. A friendly `name` improves how the sender displays.
  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email }] }],
      from: { email: env.FROM_EMAIL, name: 'RunningPaceNote' },
      subject: 'RunningPaceNote 登入連結 / Your login link',
      content: [{ type: 'text/html', value: html }]
    })
  });
  // SendGrid returns 202 Accepted on success (covered by resp.ok).
  if (!resp.ok) {
    console.log('[auth] SendGrid failed:', resp.status, await resp.text());
    return false;
  }
  return true;
}

// ── Route handlers ──────────────────────────────────────────────────────────

/** Session email if it belongs to an ADMIN_EMAILS address, else null. */
async function adminEmail(env, request) {
  const email = await getSessionEmail(request, env);
  const admins = (env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
  return email && admins.includes(email) ? email : null;
}

async function handleGetRaces(env, request) {
  // Tolerate corrupt/non-array KV content rather than throwing a 500.
  const races = safeParseArray(await env.KV.get('races'));
  const updated = (await env.KV.get('races_updated_at')) || '';
  // Defence-in-depth: filter expired races at serve time too, so a not-yet-run
  // cron (or any unpruned source) never surfaces stale races to clients.
  const { list } = pruneExpiredRaces(races, raceCutoffISO());
  return json(list, 200, env, request, {
    'Cache-Control': 'public, max-age=300',
    'X-Races-Updated': updated
  });
}

/** Admin-only on-demand crawl (same work as the daily cron) — populate now. */
async function handleRacesRefresh(env, request) {
  if (!(await adminEmail(env, request))) return json({ error: 'forbidden' }, 403, env, request);
  const result = await refreshRaces(env);
  return json({ ok: true, ...result }, 200, env, request);
}

async function handlePutRaces(env, request) {
  if (!(await adminEmail(env, request))) {
    return json({ error: 'forbidden' }, 403, env, request);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400, env, request);
  }
  const v = validateRaces(body);
  if (!v.ok) return json({ error: v.error }, 400, env, request);
  await env.KV.put('races', JSON.stringify(body));
  await env.KV.put('races_updated_at', new Date().toISOString());
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
  // Store only the token HASH — a KV/log exposure can't then replay live links.
  await env.KV.put(`magic:${await sha256Hex(token)}`, email, { expirationTtl: MAGIC_TTL_S });

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
  const tokenHash = await sha256Hex(token);
  const email = await env.KV.get(`magic:${tokenHash}`);
  if (!email) return json({ error: 'invalid_or_expired' }, 401, env, request);

  await env.KV.delete(`magic:${tokenHash}`); // single use
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
  // Cap the blob so an authenticated user can't exhaust KV storage/quota.
  const text = await request.text();
  if (text.length > MAX_DATA_BYTES) return json({ error: 'payload too large' }, 413, env, request);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'invalid json' }, 400, env, request);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return json({ error: 'expected object' }, 400, env, request);
  await env.KV.put(`user:${email}`, text); // already-validated JSON
  return json({ ok: true }, 200, env, request);
}

// ── Race source crawlers (best-effort; return [] on any failure) ─────────────

/** 運動筆記: server-rendered ?q=competition list → IRaceEvent[]. */
async function crawlBiji() {
  const resp = await fetch(BIJI_URL, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'zh-TW,zh;q=0.9' }
  });
  if (!resp.ok) {
    console.log('[cron] biji status', resp.status);
    return [];
  }
  return parseBijiRaces(await resp.text());
}

/** 馬拉松世界: POST racePage.php (XHR-style) → HTML fragment → IRaceEvent[]. */
async function crawlMarathonsWorld() {
  const resp = await fetch(MW_API_URL, {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: MW_RACELIST_URL,
      Origin: 'https://www.marathonsworld.com'
    },
    body: MW_BODY
  });
  if (!resp.ok) {
    console.log('[cron] marathonsworld status', resp.status);
    return [];
  }
  return parseMwRaces(await resp.text());
}

/**
 * Crawl every source in isolation and append-only merge into KV `races`
 * (dedupe by date+name; admin PUT entries and their Strava/GPX are preserved).
 * Shared by the daily cron and the admin POST /api/races/refresh. Returns a
 * per-source report.
 */
async function refreshRaces(env) {
  const sources = [
    ['biji', crawlBiji],
    ['marathonsworld', crawlMarathonsWorld]
  ];
  let list = safeParseArray(await env.KV.get('races'));
  let totalAdded = 0;
  let totalFetched = 0;
  const report = {};
  for (const [name, crawl] of sources) {
    try {
      const fresh = await crawl();
      const merged = mergeRaces(list, fresh);
      list = merged.list;
      totalAdded += merged.added;
      totalFetched += fresh.length;
      report[name] = { fetched: fresh.length, added: merged.added };
      console.log(`[refresh] ${name}: fetched ${fresh.length}, merged ${merged.added} new`);
    } catch (err) {
      report[name] = { error: String(err) };
      console.log(`[refresh] ${name} error:`, String(err));
    }
  }
  const updatedAt = new Date().toISOString();
  // Write when anything was fetched: new races may have been added AND existing
  // ones backfilled (distances/source), so persist even when added === 0.
  // Prune expired races on the way out so KV stays lean (only when a source
  // succeeded, so a transient all-source failure never wipes data).
  let removed = 0;
  if (totalFetched > 0) {
    const pruned = pruneExpiredRaces(list, raceCutoffISO());
    list = pruned.list;
    removed = pruned.removed;
    await env.KV.put('races', JSON.stringify(list));
    await env.KV.put('races_updated_at', updatedAt);
  }
  console.log(`[refresh] total merged: ${totalAdded} new races, pruned ${removed} expired`);
  return { added: totalAdded, removed, total: list.length, updatedAt, sources: report };
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
      if (pathname === '/api/races/refresh' && request.method === 'POST')
        return handleRacesRefresh(env, request);
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

  /** Daily multi-source race refresh (see refreshRaces). */
  async scheduled(event, env) {
    await refreshRaces(env);
  }
};
