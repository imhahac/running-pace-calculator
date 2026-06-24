/**
 * RecoveryCalculator
 * Post-race recovery estimate personalised by race distance, perceived effort,
 * age and (optionally) finish time. Anchored on the coaching "≈ 0.5 day per km"
 * heuristic (close to the classic 1-day-per-mile rule), scaled by effort, age
 * and time-on-feet. First ~24 h priorities: refuel with protein 1.6–2.0 g/kg/d
 * (Morton 2018) and sleep 9–10 h (Halson 2014); cold-water immersion (Ihsan
 * 2016) and massage (Dupuy 2018) help perceived soreness; go easy on NSAIDs as
 * they may blunt adaptation (Schoenfeld 2012).
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
  /**
   * @param finishSeconds optional finish time — adds a "time-on-feet" bump
   *   (longer duration → more muscle damage; +5%/h beyond 1 h, capped at +25%).
   */
  static recovery(
    distanceKm: number,
    effort: TEffort = 'hard',
    age = 35,
    finishSeconds?: number
  ): IRecoveryPlan {
    if (!(distanceKm > 0)) {
      return { easyDays: 0, beforeHardDays: 0, strategyKeys: [] };
    }
    const base = distanceKm * 0.5;
    const effortMult = EFFORT_MULT[effort] ?? 1.0;
    const ageMult = 1 + Math.max(0, (isFinite(age) ? age : 35) - 35) * 0.008;
    // Time-on-feet bump (heuristic): more hours racing = more cumulative damage.
    const hours = finishSeconds && finishSeconds > 0 ? finishSeconds / 3600 : 0;
    const timeMult = hours > 0 ? 1 + Math.min(0.25, Math.max(0, (hours - 1) * 0.05)) : 1;
    const beforeHardDays = Math.max(1, Math.round(base * effortMult * ageMult * timeMult));
    const easyDays = Math.max(1, Math.round(beforeHardDays * 0.5));
    return {
      easyDays,
      beforeHardDays,
      strategyKeys: ['refuel', 'rehydrate', 'sleep', 'active', 'cwi', 'massage', 'nsaid']
    };
  }
}

export default RecoveryCalculator;
