/**
 * HrvCalculator
 * HRV-guided training readiness (Plews et al.). From a short series of morning
 * RMSSD readings it computes a rolling baseline (mean ± 1 SD) and coefficient
 * of variation, then flags today's value as suppressed / normal / elevated to
 * guide whether to push or back off.
 */

export type THrvStatus = 'low' | 'normal' | 'high';

export interface IHrvResult {
  baseline: number;
  sd: number;
  cv: number;
  today: number;
  lower: number;
  upper: number;
  status: THrvStatus;
}

export type THrvRecLevel = 'quality' | 'moderate' | 'easy' | 'rest';
export type THrvRecReason = 'normal' | 'low' | 'high' | 'wellness' | 'saturation';

export interface IHrvRecommendation {
  /** 0–100 blended readiness; null when neither HRV nor wellness is available. */
  score: number | null;
  level: THrvRecLevel | null;
  reason: THrvRecReason | null;
}

// Objective HRV status → 0–100, mirroring ReadinessCalculator's mapping.
const STATUS_SCORE: Record<THrvStatus, number> = { normal: 100, high: 85, low: 40 };

export class HrvCalculator {
  /** @param rmssd morning RMSSD readings, oldest → newest (newest = today). */
  static analyze(rmssd: number[]): IHrvResult | null {
    const vals = rmssd.filter((v) => isFinite(v) && v > 0);
    if (vals.length < 3) return null;

    // Baseline = the PRIOR days (excluding today), capped to the most recent 7
    // so today is compared against a 7-day rolling normal band (mean ± 1 SD)
    // it did not help define — the Plews et al. (2013) monitoring method.
    const today = vals[vals.length - 1];
    const baseline = vals.slice(0, -1).slice(-7);
    const n = baseline.length;
    const mean = baseline.reduce((s, v) => s + v, 0) / n;
    const variance = baseline.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
    const sd = Math.sqrt(variance);
    const lower = mean - sd;
    const upper = mean + sd;
    const status: THrvStatus = today < lower ? 'low' : today > upper ? 'high' : 'normal';

    const r1 = (x: number): number => Math.round(x * 10) / 10;
    return {
      baseline: r1(mean),
      sd: r1(sd),
      cv: mean > 0 ? r1((sd / mean) * 100) : 0,
      today: r1(today),
      lower: r1(lower),
      upper: r1(upper),
      status
    };
  }

  /**
   * Synthesise today's training-intensity guidance from the objective HRV status
   * and an optional subjective wellness score (0–100, e.g. WellnessCalculator).
   * HRV is the primary signal; subjective wellness modulates it (60/40 blend when
   * both present, otherwise whichever is available). A high HRV paired with poor
   * subjective state is flagged as possible parasympathetic saturation/fatigue
   * rather than green-lit. Returns null level when neither signal is available.
   */
  static recommend(status: THrvStatus | null, wellnessScore: number | null): IHrvRecommendation {
    const hrv = status ? STATUS_SCORE[status] : null;
    const well =
      wellnessScore === null || wellnessScore === undefined || !isFinite(wellnessScore)
        ? null
        : Math.max(0, Math.min(100, wellnessScore));

    let score: number | null;
    if (hrv !== null && well !== null) score = Math.round(hrv * 0.6 + well * 0.4);
    else if (hrv !== null) score = hrv;
    else if (well !== null) score = well;
    else return { score: null, level: null, reason: null };

    const level: THrvRecLevel =
      score >= 75 ? 'quality' : score >= 55 ? 'moderate' : score >= 40 ? 'easy' : 'rest';

    let reason: THrvRecReason;
    if (status === 'high' && well !== null && well < 55) reason = 'saturation';
    else if (status === 'low') reason = 'low';
    else if (status === null) reason = 'wellness';
    else if (status === 'high') reason = 'high';
    else reason = 'normal';

    return { score, level, reason };
  }
}

export default HrvCalculator;
