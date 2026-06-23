/**
 * MenstrualCalculator
 * Maps a cycle day to one of four phases (menstrual / follicular / ovulation /
 * luteal) for phase-based training micro-adjustments. McNulty et al. (2020)
 * found only a trivial group-level effect with large individual variation, so
 * the advice emphasises listening to your own body over rigid prescription.
 * The luteal phase is anchored at ~14 days before the next period.
 */

export type TCyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

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
}

export default MenstrualCalculator;
