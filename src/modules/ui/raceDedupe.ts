/**
 * Race de-duplication for the training-tab quick-select dropdown. The same event
 * is crawled from both 運動筆記 (biji) and 馬拉松世界 with slightly different names
 * (spacing, 台↔臺, full/half-width, year, 第N屆, subtitle suffixes), so the Worker's
 * exact date+name merge leaves both. We collapse those, preferring the biji entry.
 *
 * Matching is deliberately conservative — same date AND (normalised names equal
 * OR one is a subsequence of the other). Subsequence tolerates inserted words and
 * suffixes (縣 / 全國 / "× 副標") but rejects character SUBSTITUTIONS, so genuinely
 * different same-day events (e.g. PAPAGO 西湖場 vs 苗栗場) are NOT merged.
 */

import type { IRaceEvent } from '../../types/index';

/** Normalise a race name for cross-source comparison. */
export const normalizeRaceName = (name: string): string =>
  (name || '')
    .normalize('NFKC') // full-width → half-width, unify compatibility chars
    .toLowerCase()
    .replace(/台/g, '臺') // common 台/臺 split
    .replace(/20\d{2}/g, '') // drop the year
    .replace(/第[0-9一二三四五六七八九十百]+[屆回]/g, '') // 第N屆 / 第N回
    .replace(/[^\p{L}\p{N}]/gu, ''); // strip whitespace / dashes / × / punctuation

/** Whether `a` is a subsequence of `b` (tolerates insertions / prefixes / suffixes). */
const isSubsequence = (a: string, b: string): boolean => {
  let i = 0;
  for (let j = 0; j < b.length && i < a.length; j += 1) if (a[i] === b[j]) i += 1;
  return i === a.length;
};

/** Same date and normalised names equal or one a subsequence of the other (len ≥ 5). */
const sameEvent = (a: IRaceEvent, b: IRaceEvent): boolean => {
  if (a.date !== b.date) return false;
  const na = normalizeRaceName(a.name);
  const nb = normalizeRaceName(b.name);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return Math.min(na.length, nb.length) >= 5 && (isSubsequence(na, nb) || isSubsequence(nb, na));
};

/** Order-preserving de-dupe; for a matched event keep biji over other sources. */
export const dedupePreferBiji = (races: IRaceEvent[]): IRaceEvent[] => {
  const out: IRaceEvent[] = [];
  for (const r of races) {
    const idx = out.findIndex((e) => sameEvent(e, r));
    if (idx < 0) out.push(r);
    else if (r.source === 'biji' && out[idx].source !== 'biji') out[idx] = r;
  }
  return out;
};

export default dedupePreferBiji;
