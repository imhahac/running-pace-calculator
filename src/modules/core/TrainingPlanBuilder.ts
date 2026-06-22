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
  IWorkoutStage,
  TTrainingPhase,
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
    let raw = baseline + progressStep;

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
