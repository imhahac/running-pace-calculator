/**
 * CadenceCalculator
 * Cadence (steps/min) analysis. The "180 spm" figure is a myth — optimal
 * cadence rises with running speed and varies between runners
 * (Heiderscheit 2011). Raising cadence ~5–10% shortens overstride and lowers
 * per-step impact load on the knee and Achilles.
 */

export interface ICadenceAnalysis {
  speedKmh: number;
  strideLengthM: number | null; // null when no current cadence supplied
  recommendedLo: number;
  recommendedHi: number;
  plus5: number | null;
  plus10: number | null;
  overstriding: boolean;
}

export class CadenceCalculator {
  /**
   * @param paceSecPerKm running pace in seconds per km
   * @param currentCadence optional measured cadence (steps/min)
   */
  static analyze(paceSecPerKm: number, currentCadence?: number): ICadenceAnalysis | null {
    if (!isFinite(paceSecPerKm) || paceSecPerKm <= 0) return null;

    const speedMs = 1000 / paceSecPerKm;
    const speedKmh = speedMs * 3.6;

    // Speed-scaled recommendation band (spm): faster running → higher cadence.
    const mid = 165 + (speedKmh - 8) * 2.2;
    const recommendedLo = Math.round(Math.max(160, mid - 5));
    const recommendedHi = Math.round(Math.max(recommendedLo + 8, mid + 5));

    let strideLengthM: number | null = null;
    let plus5: number | null = null;
    let plus10: number | null = null;
    let overstriding = false;

    if (typeof currentCadence === 'number' && isFinite(currentCadence) && currentCadence > 0) {
      strideLengthM = Math.round((speedMs / (currentCadence / 60)) * 100) / 100;
      plus5 = Math.round(currentCadence * 1.05);
      plus10 = Math.round(currentCadence * 1.1);
      overstriding = currentCadence < recommendedLo;
    }

    return {
      speedKmh: Math.round(speedKmh * 10) / 10,
      strideLengthM,
      recommendedLo,
      recommendedHi,
      plus5,
      plus10,
      overstriding
    };
  }
}

export default CadenceCalculator;
