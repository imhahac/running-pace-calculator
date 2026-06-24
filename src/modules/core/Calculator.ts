/**
 * Calculator Module
 * Core calculation engine for running pace, splits, and predictions
 */

import {
  RIEGEL_EXPONENT,
  TRAINING_ZONES,
  TRAINING_PLAN,
  ROAD_SPLIT_DISTANCES,
  HALF_MARATHON_METERS,
  FULL_MARATHON_METERS
} from '../../constants/index.js';
import TimeFormatter from './TimeFormatter.js';
import Converter from './Converter.js';
import TrainingPlanBuilder, { type ITrainingPlanContext } from './TrainingPlanBuilder.js';
import type {
  IPaceState,
  ITrainingWeekPlan,
  ITrainingDay,
  ITrainingPlanConfig,
  TTrainingSchool,
  TWorkoutType
} from '../../types/index';

export class Calculator {
  /**
   * Calculate based on mode and return secondsPerLap for unified processing
   * @param mode - Calculation mode
   * @param state - Current application state
   * @param paceMin - Pace minutes (for pace mode)
   * @param paceSec - Pace seconds (for pace mode)
   * @param trackSec - Track time in seconds (for track mode)
   * @param treadmillVal - Treadmill speed (for treadmill mode)
   * @param finishTimeVal - Finish time string (for finish_time mode)
   * @returns Seconds per lap, or 0 if invalid
   */
  static calculateSecondsPerLap(
    mode: string,
    state: IPaceState,
    paceMin: number = 0,
    paceSec: number = 0,
    trackSec: number = 0,
    treadmillVal: number = 0,
    finishTimeVal: string = ''
  ): number {
    let secondsPerLap = 0;

    if (mode === 'pace') {
      let paceSeconds = paceMin * 60 + paceSec;
      if (state.paceUnit === 'mile') {
        paceSeconds = Converter.paceMileToKm(paceSeconds);
      }
      // Pace is min/km => seconds/km. Convert to seconds/lane
      secondsPerLap = (state.lane * paceSeconds) / 1000;
    } else if (mode === 'track') {
      const trackDist = state.trackDistance || 400;
      secondsPerLap = trackSec * (state.lane / trackDist);
    } else if (mode === 'treadmill') {
      let speedKph = treadmillVal;
      if (state.treadmillUnit === 'mile') {
        speedKph = Converter.mphToKph(treadmillVal);
      }
      if (speedKph > 0) {
        // Speed in kph => meters per second => seconds per lane
        secondsPerLap = (state.lane * 3.6) / speedKph;
      }
    } else if (mode === 'finish_time') {
      const totalSeconds = TimeFormatter.parse(finishTimeVal);
      if (state.distance > 0) {
        secondsPerLap = (state.lane * totalSeconds) / state.distance;
      }
    }

    // Validate result
    return secondsPerLap > 0 && isFinite(secondsPerLap) ? secondsPerLap : 0;
  }

  /**
   * Calculate split times for various distances
   * @param secondsPerLap - Time for one lap (state.lane meters)
   * @param lameDistance - Distance of one lap in meters (usually 400)
   * @returns Record of split distances and times
   */
  static calculateSplits(secondsPerLap: number, laneDistance: number): Record<string, string> {
    const perMeter = secondsPerLap / laneDistance;
    const splits: Record<string, string> = {};

    // Calculate standard distances
    const distances = [100, 200, 300, 400, 800, 1200, 1600, 2000];
    distances.forEach((dist) => {
      const time = dist * perMeter;
      splits[`m${dist}`] = TimeFormatter.format(time);
    });

    // Calculate increments
    const m100 = perMeter * 100;
    const m200 = perMeter * 200;
    const m300 = perMeter * 300;
    const m400 = perMeter * 400;

    splits['inc200'] = `(+${this.round(m200 - m100, 1)})`;
    splits['inc300'] = `(+${this.round(m300 - m200, 1)})`;
    splits['inc400'] = `(+${this.round(m400 - m300, 1)})`;

    return splits;
  }

  /**
   * Calculate training zone paces
   * @param paceSecondsPerKm - Current pace in seconds per km
   * @returns Record of zone names and pace strings
   */
  static calculateTrainingZones(paceSecondsPerKm: number): Record<string, string> {
    const zones: Record<string, string> = {};

    const zoneNames: (keyof typeof TRAINING_ZONES)[] = [
      'easy',
      'marathon',
      'threshold',
      'interval',
      'repetition'
    ];

    zoneNames.forEach((zoneName) => {
      const multiplier = TRAINING_ZONES[zoneName];
      const zonePaceSeconds = paceSecondsPerKm * multiplier;
      zones[zoneName] = TimeFormatter.format(zonePaceSeconds);
    });

    return zones;
  }

  /**
   * Predict finish time using Riegel's formula
   * @param referenceDistance - Reference race distance in meters
   * @param referencePaceSecondsPerKm - Reference pace in seconds per km
   * @param targetDistance - Target race distance in meters
   * @returns Predicted time in seconds
   */
  static predictFinishTime(
    referenceDistance: number,
    referencePaceSecondsPerKm: number,
    targetDistance: number
  ): number {
    if (referenceDistance <= 0 || referencePaceSecondsPerKm <= 0 || targetDistance <= 0) {
      return 0;
    }

    // Riegel's formula: Time2 = Time1 * (Distance2/Distance1)^1.06
    const timeRatio = Math.pow(targetDistance / referenceDistance, RIEGEL_EXPONENT);
    const predictedSeconds = ((referencePaceSecondsPerKm * referenceDistance) / 1000) * timeRatio;

    return predictedSeconds;
  }

  /**
   * Generate road split distances with calculated times
   * @param secondsPerLap - Time for one lap
   * @param laneDistance - Distance of one lap in meters
   * @returns Array of {distance, time, label} objects
   */
  static generateRoadSplits(
    secondsPerLap: number,
    laneDistance: number
  ): Array<{ distance: number; time: string; label: string }> {
    const perMeter = secondsPerLap / laneDistance;
    const splits: Array<{ distance: number; time: string; label: string }> = [];

    ROAD_SPLIT_DISTANCES.forEach((distance) => {
      const time = distance * perMeter;
      let label = `${(distance / 1000).toFixed(1)}k`;

      // Custom labels
      if (Math.abs(distance - HALF_MARATHON_METERS) < 1) {
        label = 'Half';
      } else if (Math.abs(distance - FULL_MARATHON_METERS) < 1) {
        label = 'Full';
      }

      splits.push({
        distance,
        time: TimeFormatter.format(time),
        label
      });
    });

    return splits;
  }

  /**
   * Round a number to specified decimal places
   * @param num - Number to round
   * @param precision - Number of decimal places
   * @returns Rounded number
   */
  static round(num: number, precision: number = 0): number {
    const factor = Math.pow(10, precision);
    return Math.round((num + Number.EPSILON) * factor) / factor;
  }

  /**
   * Generate weekly training cycle recommendations until race day.
   * Pure orchestration over TrainingPlanBuilder; all tuning lives in
   * constants (TRAINING_PLAN / PHASE_PACE_PLAN).
   * @param now - Reference "today" (injectable for deterministic tests)
   */
  static generateTrainingCycle(
    paceSecondsPerKm: number,
    targetDateISO: string,
    focusTextMap: Record<'base' | 'build' | 'peak' | 'taper' | 'race', string>,
    workoutTextMap: Record<'easy' | 'tempo' | 'interval' | 'race', string>,
    planDistanceMeters: number = FULL_MARATHON_METERS,
    isTriathlon: boolean = false,
    translate: (key: string) => string,
    now: Date = new Date(),
    config?: ITrainingPlanConfig,
    school?: TTrainingSchool
  ): ITrainingWeekPlan[] {
    if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0 || !targetDateISO) {
      return [];
    }

    const today = now;
    const target = new Date(targetDateISO);
    if (isNaN(target.getTime()) || target.getTime() <= today.getTime()) {
      return [];
    }

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weekCount =
      config && config.weeks && config.weeks >= 1
        ? Math.min(TRAINING_PLAN.maxWeeks, Math.floor(config.weeks))
        : Math.min(TRAINING_PLAN.maxWeeks, Math.max(1, Math.ceil(diffDays / 7)));

    const ctx: ITrainingPlanContext = {
      paceSecondsPerKm,
      weekCount,
      raceScale: TrainingPlanBuilder.resolveRaceScale(planDistanceMeters),
      planDistanceMeters,
      isTriathlon,
      translate,
      workoutTextMap,
      config
    };

    const plans: ITrainingWeekPlan[] = [];

    for (let week = 1; week <= weekCount; week += 1) {
      const phase = TrainingPlanBuilder.phaseForWeek(week, weekCount);
      const p = TrainingPlanBuilder.paceByPhase(phase, paceSecondsPerKm);
      const mileage = TrainingPlanBuilder.buildMileage(week, phase, ctx);

      // Weekly structure: Mon: Rest, Tue: Interval/Tempo, Wed: Easy/Swim,
      // Thu: Medium Long/Bike, Fri: Easy/Swim, Sat: Long Run, Sun: Easy/Bike
      const buildDay = (dIdx: number, type: TWorkoutType): ITrainingDay => {
        const info = TrainingPlanBuilder.workoutDesc(type, p, ctx);
        return {
          dayOfWeek: TrainingPlanBuilder.dayLabel(dIdx, translate),
          workoutType: type,
          description: info.desc,
          durationOrDistance: info.dur,
          paceOrIntensity: info.pace,
          stages: info.stages
        };
      };

      const days: ITrainingDay[] = [];

      if (phase === 'race' && week === weekCount) {
        days.push(buildDay(0, 'rest')); // Mon
        days.push(buildDay(1, 'easy')); // Tue
        days.push(buildDay(2, isTriathlon ? 'swim' : 'easy')); // Wed
        days.push(buildDay(3, 'rest')); // Thu
        days.push(buildDay(4, 'easy')); // Fri
        days.push(buildDay(5, 'rest')); // Sat
        days.push(buildDay(6, 'race')); // Sun
      } else {
        // School-specific Mon→Sun template (no school = original structure).
        const template = TrainingPlanBuilder.weeklyTemplate(
          school,
          phase,
          mileage.isRecovery,
          isTriathlon
        );
        template.forEach((type, idx) => days.push(buildDay(idx, type)));
      }

      plans.push({
        week,
        weekLabel: `W${week}`,
        focus: focusTextMap[phase],
        totalMileageKm: mileage.mileage,
        isRecoveryWeek: mileage.isRecovery,
        days
      });
    }

    return plans;
  }
}

export default Calculator;
