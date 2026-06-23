/**
 * HeartRateCalculator Module
 * Max-HR estimation, Karvonen (heart-rate-reserve) training zones, and a
 * VO2max estimate. Zone boundaries follow Daniels' 5-zone %HRR model.
 */

import type { IHrZone, THrFormula, TVdotZoneKey } from '../../types/index';

/** Daniels 5-zone %HRR boundaries (fraction of heart-rate reserve). */
export const HR_ZONE_BOUNDS: { key: TVdotZoneKey; lo: number; hi: number }[] = [
  { key: 'easy', lo: 0.65, hi: 0.78 },
  { key: 'marathon', lo: 0.78, hi: 0.85 },
  { key: 'threshold', lo: 0.85, hi: 0.9 },
  { key: 'interval', lo: 0.9, hi: 0.95 },
  { key: 'repetition', lo: 0.95, hi: 1.0 }
];

export class HeartRateCalculator {
  /** Estimated maximum heart rate (bpm) for an age. */
  static maxHr(age: number, formula: THrFormula = 'tanaka'): number {
    if (!isFinite(age) || age <= 0) return 0;
    // Tanaka 2001: 208 − 0.7·age (recommended). Gellish 2007: 207 − 0.7·age.
    // Fox/classic: 220 − age.
    let hr: number;
    if (formula === 'fox') hr = 220 - age;
    else if (formula === 'gellish') hr = 207 - 0.7 * age;
    else hr = 208 - 0.7 * age;
    return Math.round(hr);
  }

  /** Max-HR from every supported formula, for side-by-side comparison. */
  static maxHrAll(age: number): Record<THrFormula, number> {
    return {
      tanaka: this.maxHr(age, 'tanaka'),
      gellish: this.maxHr(age, 'gellish'),
      fox: this.maxHr(age, 'fox')
    };
  }

  /** Uth–Sørensen VO2max estimate from the max/resting HR ratio. */
  static estimateVo2max(maxHr: number, restHr: number): number {
    if (maxHr <= 0 || restHr <= 0) return 0;
    return 15.3 * (maxHr / restHr);
  }

  /** Karvonen (HRR) training zones in bpm. */
  static karvonenZones(maxHr: number, restHr: number): IHrZone[] {
    if (maxHr <= 0 || restHr <= 0 || maxHr <= restHr) return [];
    const reserve = maxHr - restHr;
    const bpm = (pct: number): number => Math.round(pct * reserve + restHr);
    return HR_ZONE_BOUNDS.map((z) => ({
      key: z.key,
      loPct: z.lo,
      hiPct: z.hi,
      loBpm: bpm(z.lo),
      hiBpm: bpm(z.hi)
    }));
  }
}

export default HeartRateCalculator;
