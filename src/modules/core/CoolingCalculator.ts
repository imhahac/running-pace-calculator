/**
 * CoolingCalculator
 * Pre-/per-cooling guidance for hot races. Heat stress reuses the shade WBGT
 * and risk band from EnvironmentalPaceCalculator. Strategies escalate with
 * risk; ice-slurry dose ≈ 7.5 g/kg body weight 30–60 min pre-race
 * (Siegel 2010; Périard 2015).
 */

import EnvironmentalPaceCalculator from './EnvironmentalPaceCalculator.js';
import type { TEnvRisk } from './EnvironmentalPaceCalculator.js';

export interface ICoolingPlan {
  wbgtC: number;
  risk: TEnvRisk;
  iceSlurryG: number;
  strategyKeys: string[]; // i18n key suffixes: cool_<key>
}

const STRATEGY_BY_RISK: Record<TEnvRisk, string[]> = {
  low: ['hydrate'],
  moderate: ['hydrate', 'shade', 'colddrink'],
  high: ['hydrate', 'shade', 'colddrink', 'slurry', 'icetowel'],
  extreme: ['hydrate', 'shade', 'colddrink', 'slurry', 'icetowel', 'immersion', 'postpone']
};

export class CoolingCalculator {
  static readonly ICE_SLURRY_G_PER_KG = 7.5;

  static plan(weightKg: number, tempC: number, rhPct: number): ICoolingPlan {
    const wbgtC = Math.round(EnvironmentalPaceCalculator.wbgtShade(tempC, rhPct) * 10) / 10;
    const risk = EnvironmentalPaceCalculator.risk(wbgtC);
    const iceSlurryG = weightKg > 0 ? Math.round(this.ICE_SLURRY_G_PER_KG * weightKg) : 0;
    return { wbgtC, risk, iceSlurryG, strategyKeys: STRATEGY_BY_RISK[risk] };
  }
}

export default CoolingCalculator;
