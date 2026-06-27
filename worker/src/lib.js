/**
 * Pure, runtime-agnostic helpers for the Worker — no Cloudflare bindings, so
 * they are unit-testable with plain `node --test` (see worker/test/).
 */

export function normalizeEmail(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Resolve a valid `Access-Control-Allow-Origin` value.
 * Always normalises the configured value to a bare origin (scheme://host:port),
 * so an APP_URL that includes a path (e.g. ".../running-pace-calculator/") can
 * never produce an invalid ACAO header that silently breaks CORS.
 */
export function corsAllowOrigin(allowedRaw, requestOrigin) {
  const allowed = allowedRaw || '*';
  if (allowed === '*') return '*';
  let allowedOrigin = allowed;
  try {
    allowedOrigin = new URL(allowed).origin;
  } catch {
    /* not a full URL — use as-is */
  }
  return requestOrigin && requestOrigin === allowedOrigin ? requestOrigin : allowedOrigin;
}

/** Build the magic-link URL the email points back to. */
export function buildMagicLinkUrl(appUrl, token) {
  const base = appUrl || '';
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}login=${encodeURIComponent(token)}`;
}

/** Normalise assorted date inputs to YYYY-MM-DD (or '' if unparseable). */
export function normalizeRaceDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  const m = s.match(/(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (m) {
    const mm = m[2].length === 1 ? `0${m[2]}` : m[2];
    const dd = m[3].length === 1 ? `0${m[3]}` : m[3];
    return `${m[1]}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  return '';
}

/**
 * Best-effort parse of a JSON race feed into IRaceEvent-shaped records. Returns
 * [] for HTML / non-JSON (the common case for the JS/SPA sources), so the cron
 * degrades cleanly to "nothing to merge" rather than throwing.
 */
export function tryParseRaces(text) {
  const t = (text || '').replace(/^﻿/, '').trim();
  if (t[0] !== '[' && t[0] !== '{') return [];
  let data;
  try {
    data = JSON.parse(t);
  } catch {
    return [];
  }
  const list = Array.isArray(data)
    ? data
    : data.data || data.list || data.races || data.result || data.rows || [];
  if (!Array.isArray(list)) return [];

  const out = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    const date = normalizeRaceDate(
      row.date || row.raceDate || row.race_date || row.startDate || row.start_date || ''
    );
    const name = String(row.name || row.title || row.raceName || row.race_name || '').trim();
    if (!date || !name) continue;
    out.push({
      id: '',
      date,
      name,
      location: String(row.location || row.place || row.city || '').trim(),
      registrationLink: String(row.url || row.link || ''),
      stravaFull: '',
      stravaHalf: '',
      gpxFull: '',
      gpxHalf: ''
    });
  }
  return out;
}

/** Parse a stored JSON string into an array, tolerating null/corrupt data. */
export function safeParseArray(raw) {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/**
 * Validate an admin-supplied race list before it replaces the public feed.
 * Guards count, total size and per-record shape so bad data can't corrupt
 * `GET /api/races` (which the client consumes). Returns {ok} or {ok:false,error}.
 */
export function validateRaces(arr, opts = {}) {
  const maxCount = opts.maxCount || 5000;
  const maxBytes = opts.maxBytes || 512 * 1024;
  if (!Array.isArray(arr)) return { ok: false, error: 'expected array' };
  if (arr.length > maxCount) return { ok: false, error: `too many races (max ${maxCount})` };
  if (JSON.stringify(arr).length > maxBytes) return { ok: false, error: 'race list too large' };
  for (const r of arr) {
    if (!r || typeof r !== 'object') return { ok: false, error: 'each race must be an object' };
    if (typeof r.date !== 'string' || !r.date)
      return { ok: false, error: 'each race needs a date string' };
    if (typeof r.name !== 'string' || !r.name)
      return { ok: false, error: 'each race needs a name string' };
  }
  return { ok: true };
}

/** Lowercase hex SHA-256 of a string (Web Crypto; works in Workers and Node). */
export async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Fields a fresh crawl may backfill onto an existing entry (only when empty).
const BACKFILL_FIELDS = [
  'location',
  'registrationLink',
  'distances',
  'regClose',
  'source',
  'stravaFull',
  'stravaHalf',
  'gpxFull',
  'gpxHalf'
];

/**
 * Merge fresh races into an existing list, deduped by date+name. New races are
 * appended; for races already present, only EMPTY fields are backfilled from the
 * fresh data — so newer crawler fields (distances, source) populate older
 * records while admin-entered values (Strava/GPX) are never overwritten.
 */
export function mergeRaces(existing, fresh) {
  const list = Array.isArray(existing) ? existing.slice() : [];
  const idxByKey = new Map(list.map((r, i) => [`${r.date}_${r.name}`, i]));
  let added = 0;
  for (const r of fresh) {
    const key = `${r.date}_${r.name}`;
    if (!idxByKey.has(key)) {
      list.push(r);
      idxByKey.set(key, list.length - 1);
      added += 1;
    } else {
      const cur = list[idxByKey.get(key)];
      for (const f of BACKFILL_FIELDS) if (!cur[f] && r[f]) cur[f] = r[f];
    }
  }
  return { list, added };
}

const stripTags = (s) =>
  String(s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Parse 馬拉松世界 (marathonsworld) racePage.php HTML into IRaceEvent records.
 * The list is an HTML table whose data rows are `<tr class='ColorBar9|11'>`; each
 * date cell carries only MM/DD, so the YEAR is tracked from the `YYYY年M月`
 * section headers that precede each month block (scanned in document order).
 * Best-effort: anything unparseable is skipped, returning [] for non-matching
 * input so the cron degrades cleanly.
 */
export function parseMwRaces(html) {
  const out = [];
  if (!html || typeof html !== 'string') return out;
  let year = '';
  // Year headers and data rows, in document order (alternation keeps order).
  const re = /(\d{4})年\d{1,2}月|<tr class='ColorBar(?:9|11)'>([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      year = m[1];
      continue;
    }
    const row = m[2];
    const rid = row.match(/racedetail\.php\?rid=(\d+)'[^>]*>([\s\S]*?)<\/a>/);
    const dm = row.match(/>(\d{1,2})\/(\d{1,2})\(/); // date cell: >MM/DD(週)
    if (!rid || !dm || !year) continue;
    const name = stripTags(rid[2])
      .replace(/^[\s*]+/, '')
      .trim();
    const date = normalizeRaceDate(`${year}-${dm[1]}-${dm[2]}`);
    if (!name || !date) continue;
    const loc = row.match(/width='150'[^>]*>([\s\S]*?)<\/td>/);
    const dist = row.match(/width='130'[^>]*>([\s\S]*?)<\/td>/); // 組別 / distances cell
    out.push({
      id: '',
      date,
      name,
      location: loc ? stripTags(loc[1]) : '',
      distances: dist ? stripTags(dist[1]) : '',
      regClose: '', // marathonsworld list has no registration deadline
      source: 'marathonsworld',
      registrationLink: `https://www.marathonsworld.com/artapp/racedetail.php?rid=${rid[1]}`,
      stravaFull: '',
      stravaHalf: '',
      gpxFull: '',
      gpxHalf: ''
    });
  }
  return out;
}

/**
 * Parse 運動筆記 (running.biji.co) `?q=competition` HTML into IRaceEvent records.
 * Each race block holds a calendar link with `dates=YYYYMMDD` (the reliable full
 * date), a `competition-place` county and a `competition-name` anchor carrying
 * `cid`. We anchor on the name anchor and read the date/place from the preceding
 * window. Best-effort: unparseable entries are skipped.
 */
export function parseBijiRaces(html) {
  const out = [];
  if (!html || typeof html !== 'string') return out;
  const nameRe = /<div class="competition-name">\s*<a href='([^']+)'>([\s\S]*?)<\/a>/g;
  const matches = [...html.matchAll(nameRe)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const href = m[1];
    const name = stripTags(m[2]);
    const cid = href.match(/cid=(\d+)/);
    // date/place precede the name; the event-list (distances) follows it.
    const before = html.slice(i > 0 ? matches[i - 1].index + matches[i - 1][0].length : 0, m.index);
    const after = html.slice(
      m.index + m[0].length,
      i + 1 < matches.length ? matches[i + 1].index : html.length
    );
    if (!name || !cid) continue;

    let date = '';
    const cal = before.match(/dates=(\d{8})(?!.*dates=\d{8})/s); // last calendar date before name
    if (cal) date = `${cal[1].slice(0, 4)}-${cal[1].slice(4, 6)}-${cal[1].slice(6, 8)}`;
    date = normalizeRaceDate(date);
    if (!date) continue;

    const place = before.match(
      /competition-place"><span>([^<]*)<\/span>(?![\s\S]*competition-place)/
    );
    const distances = [
      ...new Set(
        [...after.matchAll(/event-item[^>]*>([^<]+)<\/div>/g)]
          .map((d) => d[1].trim())
          .filter(Boolean)
      )
    ].join(', ');
    // Registration window lives (as literal text) in the calendar link's details:
    // "報名日期:2026-04-16 00:00:00~2026-05-30 23:59:00" — capture the close date.
    const reg = before.match(/報名日期[:：]\s*\d{4}-\d{2}-\d{2}[^~]*~\s*(\d{4}-\d{2}-\d{2})/);
    const regClose = reg ? reg[1] : '';
    const link = href.startsWith('http')
      ? href
      : `https://running.biji.co${href.startsWith('/') ? '' : '/'}${href}`;
    out.push({
      id: '',
      date,
      name,
      location: place ? place[1].trim() : '',
      distances,
      regClose,
      source: 'biji',
      registrationLink: link,
      stravaFull: '',
      stravaHalf: '',
      gpxFull: '',
      gpxHalf: ''
    });
  }
  return out;
}
