/**
 * AcwrCalculator
 * Acute:Chronic Workload Ratio (Gabbett 2016). Acute load = the most recent
 * week; chronic load = the rolling average of the recent (up to 4) weeks.
 * Sweet spot ≈ 0.8–1.3; a ratio > 1.5 marks a sharp spike associated with
 * higher soft-tissue injury risk.
 */

export type TAcwrZone = 'undertraining' | 'sweet' | 'caution' | 'highrisk';

export interface IAcwrResult {
  acute: number;
  chronic: number;
  acwr: number;
  zone: TAcwrZone;
  recommendedNextWeekMin: number;
  recommendedNextWeekMax: number;
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
