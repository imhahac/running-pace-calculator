/**
 * AltitudeCalculator
 * Rough estimates for altitude-training blocks (Levine & Stray-Gundersen 1997;
 * Wilber 2007; Chapman 2014). The effective "live-high" window is ~2000–3000 m;
 * haemoglobin mass rises with adequate exposure hours (~+1% per ~100 effective
 * hours, capped), and VO₂max gains track Hb mass at roughly 0.6×. Numbers are
 * estimates, not promises — responders vary widely.
 */

export type TAltProtocol = 'LHTL' | 'LHTH' | 'IHE';

export interface IAltitudeResult {
  totalHours: number;
  hbMassGainPct: number;
  vo2GainPct: number;
  altitudeOk: boolean;
  hoursOk: boolean;
}

export class AltitudeCalculator {
  static analyze(
    altitudeM: number,
    days: number,
    hoursPerDay: number,
    protocol: TAltProtocol = 'LHTL'
  ): IAltitudeResult | null {
    if (!(altitudeM > 0) || !(days > 0) || !(hoursPerDay > 0)) return null;

    const totalHours = Math.round(days * hoursPerDay);
    const effective = altitudeM >= 2000 && altitudeM <= 3000;
    const hbMassGainPct = effective ? Math.min(5, Math.round((totalHours / 100) * 10) / 10) : 0;
    const vo2GainPct = Math.round(hbMassGainPct * 0.6 * 10) / 10;
    const hoursThreshold = protocol === 'IHE' ? 60 : 300;

    return {
      totalHours,
      hbMassGainPct,
      vo2GainPct,
      altitudeOk: effective,
      hoursOk: totalHours >= hoursThreshold
    };
  }

  /**
   * Illustrative Hb-mass adaptation curve: a per-day ramp from ~0 up to the
   * final gain, used only for the sparkline. Returns `[]` when there is no gain
   * or too few days to draw a line. Capped at 30 points.
   */
  static adaptationCurve(hbMassGainPct: number, days: number): number[] {
    if (!(hbMassGainPct > 0) || !(days >= 2)) return [];
    const n = Math.min(Math.max(Math.round(days), 2), 30);
    return Array.from(
      { length: n },
      (_, i) => Math.round(((hbMassGainPct * (i + 1)) / n) * 100) / 100
    );
  }
}

export default AltitudeCalculator;
