/**
 * Race-distance classification shared by the training-tab race selector and the
 * Races-list distance filter. A race's `distances` string mixes Chinese labels
 * (全馬/半馬) with numeric K/km tokens (e.g. "全馬 | 半馬 | 10.0 km", "42.2K, 21K").
 * A race "offers" a category if any label OR numeric token falls in that
 * category's band, so a multi-distance race can match several categories at once.
 */

export type DistanceCategory = 'full' | 'half' | '10k' | '5k' | 'ultra';

// Numeric band [min,max] inclusive; `text` = Chinese label regex (optional).
// 半馬 ≈ 21.0975K、全馬 ≈ 42.195K — bands widened to cover course variations
// (42/42.195/42.2/42.5/43) and odd "half-ish" distances (21/22.04/22.24).
const BANDS: Record<DistanceCategory, { min: number; max: number; text?: RegExp }> = {
  full: { min: 40, max: 44, text: /全馬|全程馬拉松/ },
  half: { min: 20, max: 23, text: /半馬|半程馬拉松/ },
  '10k': { min: 9, max: 12 },
  '5k': { min: 4, max: 6 },
  ultra: { min: 45, max: Infinity, text: /超馬|超級馬拉松/ }
};

/** Numeric distance values (km) parsed from a distances string. "42.2K"/"10 km" → 42.2/10. */
const numericTokens = (s: string): number[] => {
  const out: number[] = [];
  const re = /(\d+(?:\.\d+)?)\s*k/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(parseFloat(m[1]));
  return out;
};

/** Whether a race offers a distance in the given category. */
export const raceMatchesDistance = (
  distances: string | undefined,
  category: DistanceCategory
): boolean => {
  const s = distances || '';
  const band = BANDS[category];
  if (band.text && band.text.test(s)) return true;
  return numericTokens(s).some((v) => v >= band.min && v <= band.max);
};

/** Whether a race offers a half OR full marathon (used by the training selector). */
export const raceHasHalfOrFull = (distances: string | undefined): boolean =>
  raceMatchesDistance(distances, 'full') || raceMatchesDistance(distances, 'half');

/** Ordered categories for the Races-list distance filter dropdown. */
export const DISTANCE_CATEGORIES: DistanceCategory[] = ['full', 'half', '10k', '5k', 'ultra'];
