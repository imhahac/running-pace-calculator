/**
 * IntervalBuilder Module
 * Generates a structured interval session (warm-up + main set + cool-down) from
 * a VDOT and weekly mileage, following Jack Daniels' quality-volume rules. Each
 * workout type has its own per-session cap (Daniels): I ≤ min(10 km, 8% weekly),
 * R ≤ min(8 km, 5% weekly), T ≤ 10% weekly. Optional inputs tailor the session
 * further: goal race distance (rep length), training phase (emphasis/volume) and
 * quality days per week (so frequent quality keeps each session sustainable).
 * Pure and DOM-free.
 */

import VdotCalculator from './VdotCalculator.js';
import type { IIntervalSession } from '../../types/index';

const WARMUP_KM = 2;
const COOLDOWN_KM = 2;

export type TIntervalPhase = 'base' | 'quality' | 'peak';

export interface IIntervalOptions {
  /** Goal race distance (m) — tunes rep length. */
  goalDistanceM?: number;
  /** Training phase — shifts session volume/emphasis. */
  phase?: TIntervalPhase;
  /** Quality sessions per week — more days → smaller per-session volume. */
  qualityDays?: number;
}

// Daniels per-session quality caps + defaults per workout type.
const TYPE_CONFIG = {
  I: { repMeters: 800, rest: 'jog 2-3 min', defaultReps: 6, capFraction: 0.08, capMaxKm: 10 },
  T: { repMeters: 1600, rest: 'jog 1 min', defaultReps: 4, capFraction: 0.1, capMaxKm: 10 },
  R: { repMeters: 400, rest: 'jog 2-3 min', defaultReps: 8, capFraction: 0.05, capMaxKm: 8 }
} as const;

// Phase shifts total quality volume: base builds gradually, peak sharpens. These
// multipliers are a transparent heuristic — the DIRECTION follows Daniels'
// periodisation, but the exact factors are not a published figure. They only ever
// trim volume, so the Daniels per-type caps above stay the hard ceiling.
const PHASE_FACTOR: Record<TIntervalPhase, number> = { base: 0.8, quality: 1, peak: 0.9 };

/** Rep distance tuned to the goal race (longer goal → longer reps). */
function repMetersFor(type: 'I' | 'T' | 'R', baseMeters: number, goalDistanceM?: number): number {
  if (!goalDistanceM || !(goalDistanceM > 0)) return baseMeters;
  if (type === 'I') return goalDistanceM <= 8000 ? 800 : goalDistanceM <= 21097.5 ? 1000 : 1200;
  if (type === 'R') return goalDistanceM <= 3000 ? 200 : 400;
  return baseMeters; // T stays at cruise-interval length
}

/**
 * Frequent quality days → trim each session so the weekly load stays sane.
 * Heuristic dampening (not a published figure); like phase it only reduces
 * volume, never lifting a session above its Daniels per-type cap.
 */
function qualityDaysFactor(qualityDays?: number): number {
  if (!qualityDays || qualityDays <= 2) return 1;
  if (qualityDays === 3) return 0.85;
  return 0.7; // 4+ quality days
}

export class IntervalBuilder {
  /**
   * @param vdot Daniels VDOT
   * @param weeklyMileageKm average weekly running volume (km)
   * @param type workout type: I (VO2max), T (threshold), R (repetition)
   * @param opts optional goal distance / phase / quality-days tuning
   */
  static build(
    vdot: number,
    weeklyMileageKm: number,
    type: 'I' | 'T' | 'R' = 'I',
    opts: IIntervalOptions = {}
  ): IIntervalSession | null {
    if (vdot <= 0) return null;

    const cfg = TYPE_CONFIG[type];
    const paces = VdotCalculator.trainingPaces(vdot);
    const repPaceSec =
      type === 'I' ? paces.interval : type === 'T' ? paces.threshold : paces.repetition;
    const easyPaceSec = paces.easy;

    const repMeters = repMetersFor(type, cfg.repMeters, opts.goalDistanceM);

    // Daniels per-session quality cap: min(capMaxKm, capFraction × weekly).
    // Falls back to capMaxKm when weekly mileage is unknown (<= 0).
    const weeklyCapKm = weeklyMileageKm > 0 ? weeklyMileageKm * cfg.capFraction : cfg.capMaxKm;
    const capKm = Math.min(cfg.capMaxKm, weeklyCapKm);
    const capReps = Math.floor((capKm * 1000) / repMeters);

    // Cap first (per-session limit), then scale by phase and quality-day load.
    const phaseFactor = opts.phase ? PHASE_FACTOR[opts.phase] : 1;
    const baseReps = Math.min(cfg.defaultReps, capReps || cfg.defaultReps);
    const reps = Math.max(
      2,
      Math.round(baseReps * phaseFactor * qualityDaysFactor(opts.qualityDays))
    );
    const cappedByWeekly = reps < cfg.defaultReps;

    const mainKm = (reps * repMeters) / 1000;
    const repTimeSec = repPaceSec * (repMeters / 1000);
    // Approximate rest as easy-jog of ~60% the rep distance.
    const restSecPerRep = easyPaceSec * (repMeters / 1000) * 0.6;
    const totalKm = WARMUP_KM + mainKm + COOLDOWN_KM;
    const totalSec =
      (WARMUP_KM + COOLDOWN_KM) * easyPaceSec + reps * repTimeSec + (reps - 1) * restSecPerRep;

    return {
      type,
      repMeters,
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
