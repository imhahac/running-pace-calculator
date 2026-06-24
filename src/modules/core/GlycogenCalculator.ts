/**
 * GlycogenCalculator
 * Carbohydrate-loading protocols for events > 90 min (Burke et al. 2011
 * consensus: 10–12 g/kg/day for 36–48 h pre-race). Three schedules:
 *  - modifiedSherman: no depletion; taper training + 3 days at ~10 g/kg.
 *  - classic (Bergström): 3-day depletion then 3-day high-carb load.
 *  - wa: 1-day super-compensation (~11 g/kg, ~24–36 h, minimal exercise).
 *
 * The plan is gated on event duration: loading only benefits events lasting
 * roughly ≥ 90 min (Sherman 1981 found no gain for a ~21 km/~90 min effort;
 * Burke 2011 sets the ≥ 90 min threshold). The peak daily load is scaled within
 * 10–12 g/kg/day by how long the event is. A pre-race 1–4 g/kg top-up in the
 * 1–4 h before the start adds a further benefit (Hawley & Burke 1997).
 */

export type TGlycogenProtocol = 'modifiedSherman' | 'classic' | 'wa';

export interface IGlycogenDay {
  dayOffset: number; // negative = days before race; 0 = race day
  carbGperKg: number;
  carbG: number;
  trainingKey: string; // i18n key suffix: glyco_train_<key>
}

export interface IGlycogenPreRace {
  gPerKgLo: number;
  gPerKgHi: number;
  gramsLo: number;
  gramsHi: number;
}

export interface IGlycogenPlan {
  protocol: TGlycogenProtocol;
  needed: boolean; // false when the event is too short to benefit (< ~90 min)
  eventMinutes: number; // estimated event duration (0 when distance unknown)
  loadGperKg: number; // peak daily g/kg (0 when not needed)
  peakCarbG: number;
  days: IGlycogenDay[]; // empty when not needed
  preRaceMeal: IGlycogenPreRace; // 1–4 g/kg in the 1–4 h pre-race (Hawley & Burke)
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

// Loading benefits events of roughly this duration or longer (Burke 2011).
const MIN_BENEFIT_MIN = 90;
// Duration (min) at which the peak load reaches the top of the 10–12 g/kg band.
const FULL_LOAD_MIN = 240;
const PEAK_LO = 10;
const PEAK_HI = 12;
// Mid-pack assumption to turn a race distance into an estimated duration.
const TYPICAL_MIN_PER_KM = 5.5;

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const round1 = (x: number): number => Math.round(x * 10) / 10;

export class GlycogenCalculator {
  /** Rough event duration (minutes) from race distance; 0 when unknown. */
  static estimateEventMinutes(distanceM?: number): number {
    if (!distanceM || !(distanceM > 0)) return 0;
    return (distanceM / 1000) * TYPICAL_MIN_PER_KM;
  }

  /**
   * Daily carbohydrate schedule for a protocol, in grams for this athlete.
   * @param distanceM optional race distance; used to estimate event duration.
   * @param goalSeconds optional goal finish time — takes precedence over the
   *   distance estimate for an accurate ≥90-min gate (e.g. a slow 10 K that still
   *   exceeds 90 min, or a fast half that does not). When neither is given, the
   *   legacy behaviour (assume loading is wanted) is preserved.
   */
  static plan(
    weightKg: number,
    protocol: TGlycogenProtocol = 'modifiedSherman',
    distanceM?: number,
    goalSeconds?: number
  ): IGlycogenPlan {
    const schedule = SCHEDULES[protocol] || SCHEDULES.modifiedSherman;
    const w = weightKg > 0 ? weightKg : 0;

    // Prefer an explicit goal time (precise); fall back to a distance estimate.
    const gs = goalSeconds ?? 0;
    const hasGoal = gs > 0;
    const hasDuration = hasGoal || (distanceM !== undefined && distanceM > 0);
    const eventMinutes = hasGoal ? gs / 60 : this.estimateEventMinutes(distanceM);

    // With no distance/time, keep legacy behaviour (assume loading is wanted);
    // only a known, short event (< ~90 min) disables it.
    const needed = hasDuration ? eventMinutes >= MIN_BENEFIT_MIN : true;

    const scheduleMax = Math.max(...schedule.map((d) => d.gPerKg));
    // Peak daily load 10–12 g/kg/day by event length (Burke 2011); preserve each
    // protocol's relative ramp by scaling every day toward that peak.
    const targetPeak = hasDuration
      ? PEAK_LO +
        (PEAK_HI - PEAK_LO) *
          clamp01((eventMinutes - MIN_BENEFIT_MIN) / (FULL_LOAD_MIN - MIN_BENEFIT_MIN))
      : scheduleMax;
    const scale = targetPeak / scheduleMax;

    const days: IGlycogenDay[] = needed
      ? schedule.map((d) => ({
          dayOffset: d.dayOffset,
          carbGperKg: round1(d.gPerKg * scale),
          carbG: Math.round(d.gPerKg * scale * w),
          trainingKey: d.trainingKey
        }))
      : [];

    const loadGperKg = needed ? round1(targetPeak) : 0;

    return {
      protocol,
      needed,
      eventMinutes: Math.round(eventMinutes),
      loadGperKg,
      peakCarbG: Math.round(loadGperKg * w),
      days,
      // Pre-race 1–4 g/kg in the 1–4 h before the start (Hawley & Burke 1997).
      preRaceMeal: {
        gPerKgLo: 1,
        gPerKgHi: 4,
        gramsLo: Math.round(1 * w),
        gramsHi: Math.round(4 * w)
      }
    };
  }
}

export default GlycogenCalculator;
