/**
 * TrainingPlanBuilder Module
 * Pure, DOM-free helpers that compute a periodized training plan.
 * Extracted from Calculator.generateTrainingCycle so each step is independently
 * testable and all tuning numbers live in constants/index.ts (TRAINING_PLAN,
 * PHASE_PACE_PLAN). Behavior is identical to the previous inline implementation.
 */

import {
  TRAINING_ZONES,
  TRAINING_PLAN,
  PHASE_PACE_PLAN,
  HALF_MARATHON_METERS,
  FULL_MARATHON_METERS
} from '../../constants/index.js';
import TimeFormatter from './TimeFormatter.js';
import type {
  ITrainingPaces,
  ITrainingPlanConfig,
  IWorkoutStage,
  TTrainingPhase,
  TTrainingSchool,
  TWorkoutType
} from '../../types/index';

/**
 * Shared, immutable inputs threaded through the per-week builders.
 */
export interface ITrainingPlanContext {
  paceSecondsPerKm: number;
  weekCount: number;
  raceScale: number;
  planDistanceMeters: number;
  isTriathlon: boolean;
  translate: (key: string) => string;
  workoutTextMap: Record<'easy' | 'tempo' | 'interval' | 'race', string>;
  config?: ITrainingPlanConfig;
}

export interface IWorkoutInfo {
  desc: string;
  dur: string;
  pace: string;
  stages?: IWorkoutStage[];
}

export class TrainingPlanBuilder {
  /**
   * Volume scale derived from the goal-race distance bucket.
   */
  static resolveRaceScale(planDistanceMeters: number): number {
    if (planDistanceMeters >= 226000 || planDistanceMeters === FULL_MARATHON_METERS) {
      return TRAINING_PLAN.raceScale.long;
    }
    if (planDistanceMeters >= 113000 || planDistanceMeters === HALF_MARATHON_METERS) {
      return TRAINING_PLAN.raceScale.mid;
    }
    return TRAINING_PLAN.raceScale.short;
  }

  /**
   * Map a 1-based week number to its periodization phase.
   */
  static phaseForWeek(w: number, weekCount: number): TTrainingPhase {
    if (weekCount === 1) return 'race';
    if (w === weekCount) return 'race';
    if (w >= weekCount - 1) return 'taper';
    if (w >= weekCount - 4) return 'peak';
    if (w >= weekCount - 8) return 'build';
    return 'base';
  }

  /**
   * Weekly mileage (km) and whether the week is a recovery (down) week.
   */
  static buildMileage(
    w: number,
    phase: TTrainingPhase,
    ctx: ITrainingPlanContext
  ): { mileage: number; isRecovery: boolean } {
    const { paceSecondsPerKm, raceScale, isTriathlon } = ctx;
    const cfg = ctx.config;

    let raw: number;
    if (cfg && (cfg.startVolumeKm ?? 0) > 0 && (cfg.peakVolumeKm ?? 0) > 0) {
      // Configurable volume ramp: start → peak, reaching peak ~85% through the
      // plan, then the same per-phase reductions below apply.
      const start = cfg.startVolumeKm as number;
      const peak = cfg.peakVolumeKm as number;
      const denom = Math.max(1, ctx.weekCount - 1);
      const progress = Math.min(1, (w - 1) / denom / 0.85);
      raw = Math.round(start + (peak - start) * progress);
    } else {
      const baselineRaw = Math.max(
        TRAINING_PLAN.baselineMinKm,
        Math.min(
          TRAINING_PLAN.baselineMaxKm,
          Math.round(
            (3600 / paceSecondsPerKm) * TRAINING_PLAN.baselinePaceCoeff +
              TRAINING_PLAN.baselinePaceBase
          )
        )
      );
      const baseline = Math.max(TRAINING_PLAN.mileageFloorKm, Math.round(baselineRaw * raceScale));
      const progressStep =
        Math.floor((w - 1) / TRAINING_PLAN.progressStepWeeks) * TRAINING_PLAN.progressStepKm;
      raw = baseline + progressStep;
    }

    // Triathlon plans carry less running volume; single source of truth is the
    // isTriathlon flag (derived from state.planType by the caller).
    if (isTriathlon) {
      raw = Math.round(raw * TRAINING_PLAN.triVolumeFactor);
    }

    const isRecovery =
      w % TRAINING_PLAN.recoveryEveryWeeks === 0 && phase !== 'race' && phase !== 'taper';

    if (phase === 'race') {
      return {
        mileage: Math.max(
          TRAINING_PLAN.phaseVolume.race.floorKm,
          Math.round(raw * TRAINING_PLAN.phaseVolume.race.scale)
        ),
        isRecovery: false
      };
    }
    if (phase === 'taper') {
      return {
        mileage: Math.max(
          TRAINING_PLAN.phaseVolume.taper.floorKm,
          Math.round(raw * TRAINING_PLAN.phaseVolume.taper.scale)
        ),
        isRecovery: false
      };
    }
    if (isRecovery) {
      return {
        mileage: Math.max(
          TRAINING_PLAN.phaseVolume.recovery.floorKm,
          Math.round(raw * TRAINING_PLAN.phaseVolume.recovery.scale)
        ),
        isRecovery: true
      };
    }
    return { mileage: raw, isRecovery: false };
  }

  /**
   * Target paces (seconds/km) for each workout type within a phase.
   */
  static paceByPhase(phase: TTrainingPhase, paceSecondsPerKm: number): ITrainingPaces {
    const plan = PHASE_PACE_PLAN[phase];
    const calc = (k: 'easy' | 'tempo' | 'interval' | 'long'): number =>
      paceSecondsPerKm * TRAINING_ZONES[plan[k].zone] * plan[k].adj;
    return {
      easy: calc('easy'),
      tempo: calc('tempo'),
      interval: calc('interval'),
      long: calc('long')
    };
  }

  /**
   * Mon→Sun workout types for a (non-race) week, differentiated by training
   * school. Mon is always rest and Sat the long run; the locked periodisation
   * (phaseForWeek) and every-4th-week stepback still apply. No school reproduces
   * the original generic structure exactly.
   *  - Higdon: beginner-friendly, ≤1 quality day + weekend long run.
   *  - Pfitzinger: midweek medium-long run + threshold/VO2 quality.
   *  - Daniels: two quality days rotating T/I by phase (E fills the rest).
   */
  static weeklyTemplate(
    school: TTrainingSchool | undefined,
    phase: TTrainingPhase,
    isRecovery: boolean,
    isTriathlon: boolean
  ): TWorkoutType[] {
    if (isTriathlon) {
      const key: TWorkoutType =
        phase === 'base' || isRecovery ? 'easy' : phase === 'build' ? 'tempo' : 'interval';
      return ['rest', key, 'swim', 'bike', 'swim', 'long', 'bike'];
    }
    if (school === 'higdon') {
      const wed: TWorkoutType = isRecovery || phase === 'base' ? 'easy' : 'tempo';
      return ['rest', 'easy', wed, 'easy', 'easy', 'long', 'easy'];
    }
    if (school === 'pfitzinger') {
      const tue: TWorkoutType = isRecovery ? 'easy' : phase === 'peak' ? 'interval' : 'tempo';
      const wed: TWorkoutType = isRecovery ? 'easy' : 'medlong';
      return ['rest', tue, wed, 'easy', 'easy', 'long', 'easy'];
    }
    if (school === 'daniels') {
      const q1: TWorkoutType = isRecovery ? 'easy' : 'tempo';
      const q2: TWorkoutType = isRecovery ? 'easy' : phase === 'base' ? 'tempo' : 'interval';
      return ['rest', q1, 'easy', q2, 'easy', 'long', 'easy'];
    }
    // No school → original generic structure (unchanged behavior).
    const key: TWorkoutType =
      phase === 'base' || isRecovery ? 'easy' : phase === 'build' ? 'tempo' : 'interval';
    return ['rest', key, 'easy', 'tempo', 'easy', 'long', 'easy'];
  }

  /**
   * Localized weekday label for a 0-based day index (0 = Monday).
   */
  static dayLabel(d: number, translate: (key: string) => string): string {
    const days = ['day_mon', 'day_tue', 'day_wed', 'day_thu', 'day_fri', 'day_sat', 'day_sun'];
    return translate(days[d]);
  }

  /**
   * Build the localized description, duration, pace text and structured stages
   * for a single workout. All display text is resolved via translate()/the
   * workout text map — there are no hardcoded locale strings here.
   */
  static workoutDesc(
    type: TWorkoutType,
    p: ITrainingPaces,
    ctx: ITrainingPlanContext
  ): IWorkoutInfo {
    const { planDistanceMeters, translate, workoutTextMap, paceSecondsPerKm, isTriathlon } = ctx;
    const isTri = isTriathlon;

    if (type === 'rest') return { desc: translate('workout_rest'), dur: '-', pace: '-' };
    if (type === 'swim') {
      return {
        desc: translate('workout_swim'),
        dur: isTri && planDistanceMeters >= 113000 ? '45-60 min' : '30-45 min',
        pace: 'Easy'
      };
    }
    if (type === 'bike') {
      return {
        desc: translate('workout_bike'),
        dur:
          isTri && planDistanceMeters >= 226000
            ? '3-5 hrs'
            : isTri && planDistanceMeters >= 113000
              ? '2-3 hrs'
              : '60-90 min',
        pace: 'Zone 2'
      };
    }

    const paceStr = (paceSec: number): string => TimeFormatter.format(paceSec);
    const mPace = paceStr(paceSecondsPerKm * TRAINING_ZONES.marathon);
    const ePlus10 = paceStr(p.easy + 10);
    const ePace = paceStr(p.easy);
    const tPace = paceStr(p.tempo);
    const iPace = paceStr(p.interval);

    // Localized stage/action tokens — no hardcoded display strings.
    const tk = (key: string): string => translate(key);
    // Flatten structured stages into one readable line for the `pace` text field.
    const flatten = (st: IWorkoutStage[]): string =>
      st.map((s) => `${s.label} ${s.action}${s.pace ? ` @ ${s.pace}` : ''}`).join(', ');

    if (type === 'medlong') {
      // Pfitzinger's signature midweek medium-long: a continuous steady run.
      const dur = planDistanceMeters >= 42195 ? '90-110 min' : '70-90 min';
      const stages: IWorkoutStage[] = [
        { label: tk('stage_front'), action: tk('act_warmup'), pace: ePlus10 },
        { label: tk('stage_main'), action: tk('act_steady'), pace: ePace }
      ];
      return { desc: translate('workout_medlong'), dur, pace: flatten(stages), stages };
    }

    if (type === 'long') {
      const dur =
        planDistanceMeters >= 226000
          ? '3-4 hrs'
          : planDistanceMeters >= 113000
            ? '2-3 hrs'
            : '1.5-2.5 hrs';
      const stages: IWorkoutStage[] = [
        { label: tk('stage_front'), action: tk('act_warmup'), pace: ePlus10 },
        { label: tk('stage_mid'), action: tk('act_steady'), pace: ePace },
        {
          label: tk('stage_end'),
          action: tk('act_pickup'),
          pace: `${mPace} (${tk('note_as_able')})`
        }
      ];
      return { desc: translate('workout_long'), dur, pace: flatten(stages), stages };
    }

    if (type === 'interval') {
      const isShortRace = planDistanceMeters <= 10000;
      const dur = isShortRace ? '8-10 x 400m' : '6-8 x 800m';
      const rest = isShortRace ? `${tk('rest_short')} 60-90s` : `${tk('rest_short')} 90-120s`;
      const stages: IWorkoutStage[] = [
        { label: tk('stage_front'), action: `${tk('act_warmup')} 15m`, pace: ePace },
        { label: tk('stage_main'), action: `${dur} (${rest})`, pace: iPace, isHighlight: true },
        { label: tk('stage_end'), action: `${tk('act_cooldown')} 15m`, pace: ePace }
      ];
      return { desc: translate('workout_interval'), dur: '-', pace: flatten(stages), stages };
    }

    if (type === 'tempo') {
      const mainDur =
        planDistanceMeters >= 42195 ? '40m' : planDistanceMeters >= 21097.5 ? '30m' : '20m';
      const stages: IWorkoutStage[] = [
        { label: tk('stage_front'), action: `${tk('act_warmup')} 10m`, pace: ePace },
        {
          label: tk('stage_main'),
          action: `${tk('act_tempo_run')} ${mainDur}`,
          pace: tPace,
          isHighlight: true
        },
        { label: tk('stage_end'), action: `${tk('act_cooldown')} 10m`, pace: ePace }
      ];
      return { desc: workoutTextMap.tempo, dur: '-', pace: flatten(stages), stages };
    }

    if (type === 'race')
      return { desc: workoutTextMap.race, dur: '-', pace: paceStr(paceSecondsPerKm) };

    // Easy
    const easyDur = planDistanceMeters >= 42195 ? '50-70 min' : '40-60 min';
    return { desc: workoutTextMap.easy, dur: easyDur, pace: paceStr(p.easy) };
  }
}

export default TrainingPlanBuilder;
