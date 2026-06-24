/**
 * MenstrualCalculator
 * Maps a cycle day to one of four phases (menstrual / follicular / ovulation /
 * luteal) for phase-based training micro-adjustments. McNulty et al. (2020)
 * found only a trivial group-level effect with large individual variation, so
 * the advice emphasises listening to your own body over rigid prescription.
 * The luteal phase is anchored at ~14 days before the next period.
 *
 * `adjust()` layers day-to-day symptoms (period pain, mood, sleep) on top of the
 * phase: bad symptoms pull the recommendation toward easier work regardless of
 * phase. An irregular/absent cycle raises a RED-S flag — low energy availability
 * is the primary driver of menstrual dysfunction (Ackerman 2019).
 */

export type TCyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';
export type TDysmenorrhea = 'none' | 'mild' | 'moderate' | 'severe';
export type TMood = 'good' | 'normal' | 'low';
export type TReadiness = 'go' | 'caution' | 'easy';

export interface IMenstrualAdjustInput {
  phase: TCyclePhase;
  dysmenorrhea?: TDysmenorrhea;
  mood?: TMood;
  sleepHours?: number;
  cycleLength?: number;
  /** 1-based cycle day — used only to detect the late-luteal (PMS) window. */
  cycleDay?: number;
}

export interface IMenstrualAdjust {
  readiness: TReadiness;
  /** i18n key suffix: menstrual_rec_<key>. */
  recommendationKey: TReadiness;
  /** RED-S (low energy availability) warning — irregular/absent cycle. */
  redSFlag: boolean;
  /** Late-luteal / premenstrual window (last ~5 days) — surfaces a PMS note. */
  pmsWindow: boolean;
}

// Premenstrual symptoms cluster in the last few days of the luteal phase.
const PMS_WINDOW_DAYS = 5;

// A normal eumenorrheic cycle sits in this range; outside it flags RED-S risk.
const NORMAL_CYCLE_MIN = 21;
const NORMAL_CYCLE_MAX = 35;
const POOR_SLEEP_HOURS = 6;

export class MenstrualCalculator {
  /** @param cycleDay 1-based day in the cycle; @param cycleLength total days. */
  static phase(cycleDay: number, cycleLength = 28): TCyclePhase | null {
    if (!(cycleDay >= 1) || !(cycleLength >= 21) || cycleDay > cycleLength) return null;
    const ovulation = cycleLength - 14;
    if (cycleDay <= 5) return 'menstrual';
    if (cycleDay >= ovulation - 1 && cycleDay <= ovulation + 1) return 'ovulation';
    if (cycleDay < ovulation - 1) return 'follicular';
    return 'luteal';
  }

  /**
   * Derive the 1-based cycle day from the first day of the last period, wrapping
   * around for a regular cycle. Timezone-safe: an ISO `YYYY-MM-DD` is parsed as
   * LOCAL midnight (not the UTC midnight `new Date("YYYY-MM-DD")` would give) and
   * `now` is floored to local midnight, so the day count never slips by ±1.
   * @returns an integer in 1..cycleLength, or null if empty/invalid/future.
   */
  static cycleDayFromDate(
    lastPeriodISO: string,
    cycleLength = 28,
    now: Date = new Date()
  ): number | null {
    if (!lastPeriodISO || !(cycleLength >= 21)) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(lastPeriodISO.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const startMid = new Date(y, mo - 1, d); // local midnight
    // Reject impossible dates (e.g. 2026-02-31 rolls over → fields won't match).
    if (
      startMid.getFullYear() !== y ||
      startMid.getMonth() !== mo - 1 ||
      startMid.getDate() !== d
    ) {
      return null;
    }
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((nowMid.getTime() - startMid.getTime()) / 86400000);
    if (diffDays < 0) return null; // start date is in the future
    return (((diffDays % cycleLength) + cycleLength) % cycleLength) + 1;
  }

  /**
   * Symptom-adjusted training readiness. Period pain, low mood and short sleep
   * accumulate a "symptom load"; enough load pulls the session easier than the
   * phase alone would suggest. An out-of-range cycle length raises the RED-S flag.
   */
  static adjust(opts: IMenstrualAdjustInput): IMenstrualAdjust {
    const { dysmenorrhea = 'none', mood = 'normal', sleepHours, cycleLength = 28, cycleDay } = opts;

    // Transparent symptom-load heuristic: there is no published weighting for
    // these factors, and McNulty 2020 stresses that individual variation
    // outweighs any group-level effect. This is therefore a deliberate
    // "starting point" (surfaced to the athlete as such), not a precise dose.
    let load = 0;
    if (dysmenorrhea === 'mild') load += 1;
    else if (dysmenorrhea === 'moderate') load += 2;
    else if (dysmenorrhea === 'severe') load += 3;
    if (mood === 'low') load += 1;
    if (sleepHours !== undefined && sleepHours > 0 && sleepHours < POOR_SLEEP_HOURS) load += 1;

    const readiness: TReadiness = load >= 3 ? 'easy' : load >= 1 ? 'caution' : 'go';

    const redSFlag = !(cycleLength >= NORMAL_CYCLE_MIN && cycleLength <= NORMAL_CYCLE_MAX);

    // Late-luteal (premenstrual) window: the last few days before the next
    // period, where mood/sleep/cramp symptoms commonly cluster. Informational
    // only — it does NOT change the symptom-load readiness above.
    const pmsWindow =
      opts.phase === 'luteal' &&
      cycleDay !== undefined &&
      cycleDay > cycleLength - PMS_WINDOW_DAYS &&
      cycleDay <= cycleLength;

    return { readiness, recommendationKey: readiness, redSFlag, pmsWindow };
  }
}

export default MenstrualCalculator;
