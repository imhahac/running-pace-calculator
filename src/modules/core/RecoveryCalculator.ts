/**
 * RecoveryCalculator
 * Post-race recovery estimate personalised by race distance, perceived effort
 * and age. Anchored on the coaching "≈ 0.5 day per km" heuristic (close to the
 * classic 1-day-per-mile rule), scaled by effort and age. Within the first
 * ~24 h the priority is refuel + rehydrate + sleep (Mujika 2010; Halson 2013;
 * cold-water immersion: Ihsan 2016).
 */

export type TEffort = 'easy' | 'moderate' | 'hard' | 'allout';

export interface IRecoveryPlan {
  easyDays: number;
  beforeHardDays: number;
  strategyKeys: string[]; // i18n key suffixes: rec_<key>
}

const EFFORT_MULT: Record<TEffort, number> = {
  easy: 0.7,
  moderate: 0.85,
  hard: 1.0,
  allout: 1.15
};

export class RecoveryCalculator {
  static recovery(distanceKm: number, effort: TEffort = 'hard', age = 35): IRecoveryPlan {
    if (!(distanceKm > 0)) {
      return { easyDays: 0, beforeHardDays: 0, strategyKeys: [] };
    }
    const base = distanceKm * 0.5;
    const effortMult = EFFORT_MULT[effort] ?? 1.0;
    const ageMult = 1 + Math.max(0, (isFinite(age) ? age : 35) - 35) * 0.008;
    const beforeHardDays = Math.max(1, Math.round(base * effortMult * ageMult));
    const easyDays = Math.max(1, Math.round(beforeHardDays * 0.5));
    return {
      easyDays,
      beforeHardDays,
      strategyKeys: ['refuel', 'rehydrate', 'sleep', 'active', 'cwi']
    };
  }
}

export default RecoveryCalculator;
