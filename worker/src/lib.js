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

/** Merge fresh races into an existing list, deduped by date+name. */
export function mergeRaces(existing, fresh) {
  const list = Array.isArray(existing) ? existing.slice() : [];
  const seen = new Set(list.map((r) => `${r.date}_${r.name}`));
  let added = 0;
  for (const r of fresh) {
    const key = `${r.date}_${r.name}`;
    if (!seen.has(key)) {
      list.push(r);
      seen.add(key);
      added += 1;
    }
  }
  return { list, added };
}
