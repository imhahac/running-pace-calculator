/**
 * AcwrCalculator
 * Acute:Chronic Workload Ratio (Gabbett 2016). Acute load = the most recent
 * week; chronic load = the rolling average of the recent (up to 4) weeks.
 * Sweet spot ≈ 0.8–1.3; a ratio > 1.5 marks a sharp spike associated with
 * higher soft-tissue injury risk.
 */

export type TAcwrZone = 'undertraining' | 'sweet' | 'caution' | 'highrisk';
export type TAcwrMagnitude = 'low' | 'optimal' | 'elevated' | 'high' | 'extreme';

export interface IAcwrResult {
  acute: number;
  chronic: number;
  acwr: number;
  zone: TAcwrZone;
  recommendedNextWeekMin: number;
  recommendedNextWeekMax: number;
}

export interface IAcwrRiskContext {
  /** i18n suffix acwr_mag_<key> — injury-risk magnitude for this ratio. */
  magnitudeKey: TAcwrMagnitude;
  /** i18n suffixes acwr_protect_<key> — strength/shoe protective-factor advice. */
  protectiveKeys: string[];
}

export class AcwrCalculator {
  /** Risk zone for an ACWR value. */
  static zoneOf(acwr: number): TAcwrZone {
    if (acwr < 0.8) return 'undertraining';
    if (acwr <= 1.3) return 'sweet';
    if (acwr <= 1.5) return 'caution';
    return 'highrisk';
  }

  /**
   * Injury-risk magnitude + protective-factor advice for an ACWR value.
   * Magnitude: spike > 1.5 ≈ 2–4× soft-tissue risk (Gabbett 2016); > 2.0 ≈ 4.5×
   * (Hulin 2014). Protective factors: 2+ strength sessions/wk ≈ −50% (Lauersen
   * 2014); rotating 2+ shoes ≈ −39% (Malisoux 2015).
   */
  static riskContext(opts: {
    acwr: number;
    zone: TAcwrZone;
    strengthTraining?: boolean;
    shoeRotation?: boolean;
  }): IAcwrRiskContext {
    const { acwr, zone, strengthTraining, shoeRotation } = opts;
    const magnitudeKey: TAcwrMagnitude =
      acwr > 2.0
        ? 'extreme'
        : zone === 'highrisk'
          ? 'high'
          : zone === 'caution'
            ? 'elevated'
            : zone === 'sweet'
              ? 'optimal'
              : 'low';
    const protectiveKeys = [
      strengthTraining ? 'strength_on' : 'strength_off',
      shoeRotation ? 'shoes_on' : 'shoes_off'
    ];
    return { magnitudeKey, protectiveKeys };
  }

  /**
   * @param weeklyKm recent weekly mileage, oldest → newest (newest = this week).
   *        Needs at least 2 weeks and a positive chronic average.
   */
  static compute(weeklyKm: number[]): IAcwrResult | null {
    const weeks = weeklyKm.filter((w) => isFinite(w) && w >= 0);
    if (weeks.length < 2) return null;

    const acute = weeks[weeks.length - 1];
    const window = weeks.slice(-4); // chronic = rolling avg of up to 4 weeks
    const chronic = window.reduce((sum, w) => sum + w, 0) / window.length;
    if (chronic <= 0) return null;

    const acwr = acute / chronic;
    return {
      acute: Math.round(acute * 10) / 10,
      chronic: Math.round(chronic * 10) / 10,
      acwr: Math.round(acwr * 100) / 100,
      zone: this.zoneOf(acwr),
      // To keep next week in the sweet zone, target 0.8–1.3 × chronic.
      recommendedNextWeekMin: Math.round(chronic * 0.8),
      recommendedNextWeekMax: Math.round(chronic * 1.3)
    };
  }
}

export default AcwrCalculator;
