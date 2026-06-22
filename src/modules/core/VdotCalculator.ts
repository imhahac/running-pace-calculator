/**
 * VdotCalculator Module
 * Jack Daniels' VDOT engine using the Daniels–Gilbert equations.
 *
 *   VO2(v)   = -4.60 + 0.182258·v + 0.000104·v²        (v in m/min)
 *   pct(t)   = 0.8 + 0.1894393·e^(-0.012778·t)
 *                  + 0.2989558·e^(-0.1932605·t)          (t in minutes)
 *   VDOT     = VO2(raceVelocity) / pct(raceMinutes)
 *
 * Training paces are derived by inverting VO2(v) at a target intensity
 * (% of VDOT). Intensities are tuned to match published Daniels tables
 * (validated against the VDOT≈40 reference: E 6:07, M 5:23, T 5:05, I 4:36,
 * R 4:11 per km).
 */

import type { IVdotPaces } from '../../types/index';

const VO2_A = 0.000104;
const VO2_B = 0.182258;
const VO2_C = -4.6;

/** Intensity (fraction of VDOT) used for each easy→threshold→interval zone. */
export const VDOT_INTENSITY = {
  easy: 0.7,
  marathon: 0.82,
  threshold: 0.88,
  interval: 1.0
} as const;

/** Repetition pace is faster than interval velocity by this factor. */
export const REP_VELOCITY_FACTOR = 1.1;

export class VdotCalculator {
  /** VO2 cost (ml/kg/min) of running at velocity v (m/min). */
  private static vo2AtVelocity(v: number): number {
    return VO2_C + VO2_B * v + VO2_A * v * v;
  }

  /** Fraction of VO2max sustainable for t minutes. */
  private static pctOfMax(tMin: number): number {
    return 0.8 + 0.1894393 * Math.exp(-0.012778 * tMin) + 0.2989558 * Math.exp(-0.1932605 * tMin);
  }

  /** Velocity (m/min) that costs the given VO2 — positive root of the quadratic. */
  private static velocityForVo2(vo2: number): number {
    const c = VO2_C - vo2;
    const disc = VO2_B * VO2_B - 4 * VO2_A * c;
    if (disc < 0) return 0;
    return (-VO2_B + Math.sqrt(disc)) / (2 * VO2_A);
  }

  /**
   * VDOT from a race result.
   * @param distanceMeters race distance in meters
   * @param timeSeconds finish time in seconds
   * @returns VDOT, or 0 for invalid input
   */
  static vdotFromRace(distanceMeters: number, timeSeconds: number): number {
    if (
      !isFinite(distanceMeters) ||
      !isFinite(timeSeconds) ||
      distanceMeters <= 0 ||
      timeSeconds <= 0
    ) {
      return 0;
    }
    const tMin = timeSeconds / 60;
    const v = distanceMeters / tMin;
    const vdot = this.vo2AtVelocity(v) / this.pctOfMax(tMin);
    return isFinite(vdot) && vdot > 0 ? vdot : 0;
  }

  /**
   * Training pace (seconds/km) for a given intensity (fraction of VDOT).
   */
  static paceForIntensity(vdot: number, intensity: number): number {
    if (vdot <= 0 || intensity <= 0) return 0;
    const v = this.velocityForVo2(vdot * intensity);
    if (v <= 0) return 0;
    return (60 * 1000) / v;
  }

  /**
   * Daniels E/M/T/I/R training paces (seconds/km) for a VDOT.
   */
  static trainingPaces(vdot: number): IVdotPaces {
    const intervalV = this.velocityForVo2(vdot * VDOT_INTENSITY.interval);
    const repetition = intervalV > 0 ? (60 * 1000) / (intervalV * REP_VELOCITY_FACTOR) : 0;
    return {
      easy: this.paceForIntensity(vdot, VDOT_INTENSITY.easy),
      marathon: this.paceForIntensity(vdot, VDOT_INTENSITY.marathon),
      threshold: this.paceForIntensity(vdot, VDOT_INTENSITY.threshold),
      interval: this.paceForIntensity(vdot, VDOT_INTENSITY.interval),
      repetition
    };
  }

  /**
   * Equivalent race time (seconds) for a target distance at a given VDOT.
   * Binary search on time (VDOT decreases monotonically as time grows).
   */
  static equivalentRaceTime(vdot: number, distanceMeters: number): number {
    if (vdot <= 0 || distanceMeters <= 0) return 0;
    let lo = 60; // 1 min
    let hi = 10 * 3600; // 10 h
    for (let i = 0; i < 60; i += 1) {
      const mid = (lo + hi) / 2;
      const v = this.vdotFromRace(distanceMeters, mid);
      if (v > vdot) {
        // faster than target VDOT allows → need more time
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return Math.round((lo + hi) / 2);
  }
}

export default VdotCalculator;
