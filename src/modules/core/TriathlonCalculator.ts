import { TRIATHLON_DISTANCES } from '../../constants/index.js';

export interface ITriathlonInputs {
  swimPacePer100m: number; // seconds
  t1: number; // seconds
  bikeKmh: number;
  t2: number; // seconds
  runPacePerKm: number; // seconds
}

export interface ITriathlonResults {
  swimTime: number; // seconds
  bikeTime: number; // seconds
  runTime: number; // seconds
  totalTime: number; // seconds
}

export class TriathlonCalculator {
  /**
   * Calculate total time and segment times from specific paces
   */
  static calculateFromPaces(
    distanceKey: 51.5 | 113 | 226,
    inputs: ITriathlonInputs
  ): ITriathlonResults {
    const dists = TRIATHLON_DISTANCES[distanceKey];

    // Swim: pace is per 100m. Total distance in km * 10 = distance in 100m
    const swimTime = inputs.swimPacePer100m * (dists.swimKm * 10);

    // Bike: time = distance(km) / speed(km/h) * 3600
    const bikeTime = inputs.bikeKmh > 0 ? (dists.bikeKm / inputs.bikeKmh) * 3600 : 0;

    // Run: pace is per km
    const runTime = inputs.runPacePerKm * dists.runKm;

    const totalTime = swimTime + inputs.t1 + bikeTime + inputs.t2 + runTime;

    return {
      swimTime,
      bikeTime,
      runTime,
      totalTime
    };
  }

  /**
   * Reverse calculation: derive paces from a target total time, using typical ratios.
   * Standard typical ratios:
   * 51.5: Swim 18%, T1 2%, Bike 50%, T2 1%, Run 29%
   * 113: Swim 13%, T1 1.5%, Bike 51.5%, T2 1%, Run 33%
   * 226: Swim 11%, T1 1%, Bike 52%, T2 1%, Run 35%
   */
  static calculateFromTargetTime(
    distanceKey: 51.5 | 113 | 226,
    targetTotalSeconds: number
  ): ITriathlonInputs {
    const dists = TRIATHLON_DISTANCES[distanceKey];
    let ratios = { swim: 0.18, t1: 0.02, bike: 0.5, t2: 0.01, run: 0.29 };

    if (distanceKey === 113) {
      ratios = { swim: 0.13, t1: 0.015, bike: 0.515, t2: 0.01, run: 0.33 };
    } else if (distanceKey === 226) {
      ratios = { swim: 0.11, t1: 0.01, bike: 0.52, t2: 0.01, run: 0.35 };
    }

    const swimTime = targetTotalSeconds * ratios.swim;
    const t1 = targetTotalSeconds * ratios.t1;
    const bikeTime = targetTotalSeconds * ratios.bike;
    const t2 = targetTotalSeconds * ratios.t2;
    const runTime = targetTotalSeconds * ratios.run;

    const swimPacePer100m = swimTime / (dists.swimKm * 10);
    const bikeKmh = dists.bikeKm / (bikeTime / 3600);
    const runPacePerKm = runTime / dists.runKm;

    return {
      swimPacePer100m,
      t1,
      bikeKmh,
      t2,
      runPacePerKm
    };
  }
}

export default TriathlonCalculator;
