/**
 * IntervalBuilder Module
 * Generates a structured interval session (warm-up + main set + cool-down)
 * from a VDOT and weekly mileage, enforcing Daniels' quality-volume cap
 * (a single session's quality work ≤ min(10 km, 8% of weekly mileage)).
 * Pure and DOM-free.
 */

import VdotCalculator from './VdotCalculator.js';
import type { IIntervalSession } from '../../types/index';

const WARMUP_KM = 2;
const COOLDOWN_KM = 2;
const MAX_QUALITY_KM = 10;
const WEEKLY_FRACTION = 0.08;

// Default rep distance and recovery per workout type.
const TYPE_CONFIG = {
  I: { repMeters: 800, rest: 'jog 2-3 min', defaultReps: 6 },
  T: { repMeters: 1600, rest: 'jog 1 min', defaultReps: 4 },
  R: { repMeters: 400, rest: 'jog 2-3 min', defaultReps: 8 }
} as const;

export class IntervalBuilder {
  /**
   * @param vdot Daniels VDOT
   * @param weeklyMileageKm average weekly running volume (km)
   * @param type workout type: I (VO2max), T (threshold), R (repetition)
   */
  static build(
    vdot: number,
    weeklyMileageKm: number,
    type: 'I' | 'T' | 'R' = 'I'
  ): IIntervalSession | null {
    if (vdot <= 0) return null;

    const cfg = TYPE_CONFIG[type];
    const paces = VdotCalculator.trainingPaces(vdot);
    const repPaceSec =
      type === 'I' ? paces.interval : type === 'T' ? paces.threshold : paces.repetition;
    const easyPaceSec = paces.easy;

    // Quality-volume cap: min(10 km, 8% of weekly mileage). Falls back to the
    // default reps when weekly mileage is unknown (<= 0).
    const weeklyCapKm = weeklyMileageKm > 0 ? weeklyMileageKm * WEEKLY_FRACTION : MAX_QUALITY_KM;
    const capKm = Math.min(MAX_QUALITY_KM, weeklyCapKm);
    const capReps = Math.floor((capKm * 1000) / cfg.repMeters);

    const reps = Math.max(2, Math.min(cfg.defaultReps, capReps || cfg.defaultReps));
    const cappedByWeekly = reps < cfg.defaultReps;

    const mainKm = (reps * cfg.repMeters) / 1000;
    const repTimeSec = repPaceSec * (cfg.repMeters / 1000);
    // Approximate rest as easy-jog of ~60% the rep distance.
    const restSecPerRep = easyPaceSec * (cfg.repMeters / 1000) * 0.6;
    const totalKm = WARMUP_KM + mainKm + COOLDOWN_KM;
    const totalSec =
      (WARMUP_KM + COOLDOWN_KM) * easyPaceSec + reps * repTimeSec + (reps - 1) * restSecPerRep;

    return {
      type,
      repMeters: cfg.repMeters,
      reps,
      repPaceSec,
      restDesc: cfg.rest,
      warmupKm: WARMUP_KM,
      cooldownKm: COOLDOWN_KM,
      mainKm,
      totalKm,
      totalSec,
      cappedByWeekly
    };
  }
}

export default IntervalBuilder;
