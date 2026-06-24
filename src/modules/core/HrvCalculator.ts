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
}

export default HrvCalculator;
