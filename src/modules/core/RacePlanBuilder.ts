/**
 * RacePlanBuilder Module
 * Builds a per-kilometer race-pace plan for a target finish time, under an
 * even / negative / positive split strategy. Pure and DOM-free.
 */

import VdotCalculator from './VdotCalculator.js';
import type { IRacePlan, IRacePlanRow, TRaceStrategy } from '../../types/index';

// End-segments deviate from average pace by this fraction for non-even splits.
const SPLIT_DELTA = 0.06;

export class RacePlanBuilder {
  /**
   * @param distanceMeters race distance in meters
   * @param targetSeconds target finish time in seconds
   * @param strategy pacing strategy
   */
  static build(
    distanceMeters: number,
    targetSeconds: number,
    strategy: TRaceStrategy = 'even'
  ): IRacePlan {
    const empty: IRacePlan = { rows: [], avgPaceSec: 0, avgSpeedKmh: 0, vdot: 0 };
    if (!(distanceMeters > 0) || !(targetSeconds > 0)) return empty;

    const totalKm = distanceMeters / 1000;
    const nFull = Math.floor(totalKm + 1e-9);
    const segLengths: number[] = [];
    for (let i = 0; i < nFull; i += 1) segLengths.push(1);
    const remainder = totalKm - nFull;
    if (remainder > 1e-6) segLengths.push(remainder);

    // Pace factor per segment from its midpoint progress p∈[0,1).
    // negative: slower start (>1) → faster finish (<1); positive: the reverse.
    const delta = strategy === 'even' ? 0 : SPLIT_DELTA;
    let cum = 0;
    const factors = segLengths.map((len) => {
      const mid = (cum + len / 2) / totalKm;
      cum += len;
      const ramp = delta * (1 - 2 * mid);
      return strategy === 'positive' ? 1 - ramp : 1 + ramp;
    });

    // Base pace so that Σ(base·factor·len) = target.
    const sumFL = segLengths.reduce((s, len, i) => s + factors[i] * len, 0);
    const basePace = targetSeconds / sumFL;

    let cumKm = 0;
    let cumSec = 0;
    const rows: IRacePlanRow[] = segLengths.map((len, i) => {
      const paceSec = basePace * factors[i];
      cumSec += paceSec * len;
      cumKm += len;
      const progress = cumKm / totalKm;
      let phase: IRacePlanRow['phase'] = 'mid';
      if (progress <= 0.15) phase = 'start';
      else if (progress >= 0.999) phase = 'finish';
      else if (progress >= 0.85) phase = 'surge';
      return {
        km: Math.round(cumKm * 100) / 100,
        paceSec,
        cumulativeSec: cumSec,
        phase
      };
    });

    return {
      rows,
      avgPaceSec: targetSeconds / totalKm,
      avgSpeedKmh: (3600 * totalKm) / targetSeconds,
      vdot: VdotCalculator.vdotFromRace(distanceMeters, targetSeconds)
    };
  }
}

export default RacePlanBuilder;
