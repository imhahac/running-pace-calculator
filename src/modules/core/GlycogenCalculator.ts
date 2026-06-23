/**
 * GlycogenCalculator
 * Carbohydrate-loading protocols for events > 90 min (Burke et al. 2011
 * consensus: 10–12 g/kg/day for 36–48 h pre-race). Three schedules:
 *  - modifiedSherman: no depletion; taper training + 3 days at ~10 g/kg.
 *  - classic (Bergström): 3-day depletion then 3-day high-carb load.
 *  - wa: 1-day super-compensation (~11 g/kg, ~24–36 h, minimal exercise).
 */

export type TGlycogenProtocol = 'modifiedSherman' | 'classic' | 'wa';

export interface IGlycogenDay {
  dayOffset: number; // negative = days before race; 0 = race day
  carbGperKg: number;
  carbG: number;
  trainingKey: string; // i18n key suffix: glyco_train_<key>
}

export interface IGlycogenPlan {
  protocol: TGlycogenProtocol;
  loadGperKg: number;
  peakCarbG: number;
  days: IGlycogenDay[];
}

type TDaySpec = { dayOffset: number; gPerKg: number; trainingKey: string };

const SCHEDULES: Record<TGlycogenProtocol, TDaySpec[]> = {
  modifiedSherman: [
    { dayOffset: -6, gPerKg: 5, trainingKey: 'normal' },
    { dayOffset: -5, gPerKg: 5, trainingKey: 'normal' },
    { dayOffset: -4, gPerKg: 7, trainingKey: 'easy' },
    { dayOffset: -3, gPerKg: 10, trainingKey: 'easy' },
    { dayOffset: -2, gPerKg: 10, trainingKey: 'easy' },
    { dayOffset: -1, gPerKg: 10, trainingKey: 'rest' },
    { dayOffset: 0, gPerKg: 7, trainingKey: 'race' }
  ],
  classic: [
    { dayOffset: -6, gPerKg: 4, trainingKey: 'deplete' },
    { dayOffset: -5, gPerKg: 4, trainingKey: 'deplete' },
    { dayOffset: -4, gPerKg: 4, trainingKey: 'deplete' },
    { dayOffset: -3, gPerKg: 10, trainingKey: 'easy' },
    { dayOffset: -2, gPerKg: 10, trainingKey: 'easy' },
    { dayOffset: -1, gPerKg: 10, trainingKey: 'rest' },
    { dayOffset: 0, gPerKg: 7, trainingKey: 'race' }
  ],
  wa: [
    { dayOffset: -3, gPerKg: 5, trainingKey: 'easy' },
    { dayOffset: -2, gPerKg: 5, trainingKey: 'easy' },
    { dayOffset: -1, gPerKg: 11, trainingKey: 'rest' },
    { dayOffset: 0, gPerKg: 7, trainingKey: 'race' }
  ]
};

export class GlycogenCalculator {
  /** Daily carbohydrate schedule for a protocol, in grams for this athlete. */
  static plan(weightKg: number, protocol: TGlycogenProtocol = 'modifiedSherman'): IGlycogenPlan {
    const schedule = SCHEDULES[protocol] || SCHEDULES.modifiedSherman;
    const w = weightKg > 0 ? weightKg : 0;
    const days: IGlycogenDay[] = schedule.map((d) => ({
      dayOffset: d.dayOffset,
      carbGperKg: d.gPerKg,
      carbG: Math.round(d.gPerKg * w),
      trainingKey: d.trainingKey
    }));
    const loadGperKg = Math.max(...schedule.map((d) => d.gPerKg));
    return {
      protocol,
      loadGperKg,
      peakCarbG: Math.round(loadGperKg * w),
      days
    };
  }
}

export default GlycogenCalculator;
