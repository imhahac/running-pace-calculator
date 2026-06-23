/**
 * RunningEconomyCalculator
 * Estimates VO₂max from a 5K result (reusing the Daniels VDOT engine) and
 * classifies body-fat percentage into standard bands (ACE). Running economy
 * improves ~2–8% with strength + plyometric training (Beattie 2017); the
 * controller surfaces a three-layer strategy (strength, plyometrics, body
 * composition).
 */

import VdotCalculator from './VdotCalculator.js';

export type TSex = 'male' | 'female';

/** Body-fat band upper bounds (%). Below the bound → that band. */
const BF_BANDS: Record<TSex, { key: string; max: number }[]> = {
  male: [
    { key: 'essential', max: 6 },
    { key: 'athlete', max: 14 },
    { key: 'fitness', max: 18 },
    { key: 'average', max: 25 },
    { key: 'high', max: Infinity }
  ],
  female: [
    { key: 'essential', max: 14 },
    { key: 'athlete', max: 21 },
    { key: 'fitness', max: 25 },
    { key: 'average', max: 32 },
    { key: 'high', max: Infinity }
  ]
};

export class RunningEconomyCalculator {
  /** Estimated VO₂max (≈ VDOT) from a 5K time in seconds. */
  static vo2maxFrom5k(sec: number): number {
    if (!(sec > 0)) return 0;
    return VdotCalculator.vdotFromRace(5000, sec);
  }

  /** Classify body-fat % into a band key for the athlete's sex. */
  static bodyFatBand(sex: TSex, bodyFatPct: number): string {
    if (!isFinite(bodyFatPct) || bodyFatPct <= 0) return '';
    const bands = BF_BANDS[sex] || BF_BANDS.male;
    return (bands.find((b) => bodyFatPct < b.max) || bands[bands.length - 1]).key;
  }
}

export default RunningEconomyCalculator;
