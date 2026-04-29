/**
 * Calculator Module
 * Core calculation engine for running pace, splits, and predictions
 */

import { RIEGEL_EXPONENT, TRAINING_ZONES, ROAD_SPLIT_DISTANCES, HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../constants/index.js';
import TimeFormatter from './TimeFormatter.js';
import Converter from './Converter.js';
import type { IPaceState, ITrainingWeekPlan } from '../types/index';

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
      secondsPerLap = trackSec;

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
      let totalSeconds = TimeFormatter.parse(finishTimeVal);
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
    const predictedSeconds = (referencePaceSecondsPerKm * referenceDistance) / 1000 * timeRatio;

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
    return Math.round(num * factor) / factor;
  }

  /**
   * Generate weekly training cycle recommendations until race day.
   */
  static generateTrainingCycle(
    paceSecondsPerKm: number,
    targetDateISO: string,
    focusTextMap: Record<'base' | 'build' | 'peak' | 'taper' | 'race', string>,
    workoutTextMap: Record<'easy' | 'tempo' | 'interval' | 'race', string>
  ): ITrainingWeekPlan[] {
    if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0 || !targetDateISO) {
      return [];
    }

    const today = new Date();
    const target = new Date(targetDateISO);
    if (isNaN(target.getTime()) || target.getTime() <= today.getTime()) {
      return [];
    }

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const weekCount = Math.min(24, Math.max(1, Math.ceil(diffDays / 7)));
    const plans: ITrainingWeekPlan[] = [];

    const phaseForWeek = (w: number): 'base' | 'build' | 'peak' | 'taper' | 'race' => {
      if (weekCount === 1) return 'race';
      if (w === weekCount) return 'race';
      if (w >= weekCount - 1) return 'taper';
      if (w >= weekCount - 4) return 'peak';
      if (w >= weekCount - 8) return 'build';
      return 'base';
    };

    const buildMileage = (w: number, phase: 'base' | 'build' | 'peak' | 'taper' | 'race'): { mileage: number; isRecovery: boolean } => {
      const baseline = Math.max(24, Math.min(80, Math.round(3600 / paceSecondsPerKm * 6 + 16)));
      const progressStep = Math.floor((w - 1) / 3) * 4;
      const raw = baseline + progressStep;
      const isRecovery = w % 4 === 0 && phase !== 'race' && phase !== 'taper';

      if (phase === 'race') return { mileage: Math.max(16, Math.round(raw * 0.45)), isRecovery: false };
      if (phase === 'taper') return { mileage: Math.max(20, Math.round(raw * 0.65)), isRecovery: false };
      if (isRecovery) return { mileage: Math.max(22, Math.round(raw * 0.7)), isRecovery: true };
      return { mileage: raw, isRecovery: false };
    };

    const workoutForPhase = (phase: 'base' | 'build' | 'peak' | 'taper' | 'race', isRecovery: boolean): string => {
      if (phase === 'race') return workoutTextMap.race;
      if (isRecovery) return workoutTextMap.easy;
      if (phase === 'base') return workoutTextMap.easy;
      if (phase === 'build') return workoutTextMap.tempo;
      return workoutTextMap.interval;
    };

    const paceByPhase = (phase: 'base' | 'build' | 'peak' | 'taper' | 'race'): {
      easy: number;
      tempo: number;
      interval: number;
      long: number;
    } => {
      switch (phase) {
        case 'base':
          return { easy: paceSecondsPerKm + 80, tempo: paceSecondsPerKm + 20, interval: paceSecondsPerKm - 5, long: paceSecondsPerKm + 55 };
        case 'build':
          return { easy: paceSecondsPerKm + 70, tempo: paceSecondsPerKm + 15, interval: paceSecondsPerKm - 10, long: paceSecondsPerKm + 45 };
        case 'peak':
          return { easy: paceSecondsPerKm + 60, tempo: paceSecondsPerKm + 10, interval: paceSecondsPerKm - 15, long: paceSecondsPerKm + 35 };
        case 'taper':
          return { easy: paceSecondsPerKm + 55, tempo: paceSecondsPerKm + 12, interval: paceSecondsPerKm - 8, long: paceSecondsPerKm + 30 };
        default:
          return { easy: paceSecondsPerKm + 50, tempo: paceSecondsPerKm + 5, interval: paceSecondsPerKm - 5, long: paceSecondsPerKm + 20 };
      }
    };

    for (let week = 1; week <= weekCount; week += 1) {
      const phase = phaseForWeek(week);
      const p = paceByPhase(phase);
      const mileage = buildMileage(week, phase);
      plans.push({
        week,
        weekLabel: `W${week}`,
        focus: focusTextMap[phase],
        easyPace: TimeFormatter.format(p.easy),
        tempoPace: TimeFormatter.format(p.tempo),
        intervalPace: TimeFormatter.format(Math.max(120, p.interval)),
        longRunPace: TimeFormatter.format(p.long),
        totalMileageKm: mileage.mileage,
        keyWorkout: workoutForPhase(phase, mileage.isRecovery),
        isRecoveryWeek: mileage.isRecovery
      });
    }

    return plans;
  }
}

export default Calculator;
