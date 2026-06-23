/**
 * EnvironmentalPaceCalculator
 * Adjusts a target pace for heat/humidity and slope.
 *  - Dew point: Magnus formula.
 *  - WBGT (shade): Australian Bureau of Meteorology approximation
 *    (WBGT ≈ 0.567·T + 0.393·e + 3.94, e = water-vapour pressure).
 *  - Heat slowdown %: piecewise mapping of WBGT to performance loss
 *    (Ely 2007; El Helou 2012 — endurance time degrades as WBGT rises).
 *  - Grade factor: Minetti et al. 2002 metabolic cost of gradient running.
 */

export type TEnvRisk = 'low' | 'moderate' | 'high' | 'extreme';

export interface IEnvAdjustment {
  dewPointC: number;
  wbgtC: number;
  heatPct: number; // % slower due to heat/humidity
  gradeFactor: number; // pace multiplier vs flat (1.0 = flat ground)
  adjustedPaceSec: number; // base pace adjusted for heat + grade (sec/km)
  risk: TEnvRisk;
}

export class EnvironmentalPaceCalculator {
  /** Dew point (°C) via the Magnus formula. */
  static dewPoint(tempC: number, rhPct: number): number {
    const rh = Math.min(100, Math.max(1, rhPct)) / 100;
    const a = 17.625;
    const b = 243.04;
    const gamma = Math.log(rh) + (a * tempC) / (b + tempC);
    return (b * gamma) / (a - gamma);
  }

  /** Saturation-scaled water-vapour pressure (hPa). */
  private static vapourPressure(tempC: number, rhPct: number): number {
    const rh = Math.min(100, Math.max(0, rhPct)) / 100;
    return rh * 6.105 * Math.exp((17.27 * tempC) / (237.7 + tempC));
  }

  /** Shade WBGT (°C) — ABM approximation. */
  static wbgtShade(tempC: number, rhPct: number): number {
    const e = this.vapourPressure(tempC, rhPct);
    return 0.567 * tempC + 0.393 * e + 3.94;
  }

  /** Heat-induced slowdown (%), mapped piecewise from shade WBGT. */
  static heatSlowdownPct(tempC: number, rhPct: number): number {
    const w = this.wbgtShade(tempC, rhPct);
    if (w <= 10) return 0;
    if (w <= 18) return ((w - 10) / 8) * 2; // 0 → 2%
    if (w <= 23) return 2 + ((w - 18) / 5) * 3; // 2 → 5%
    if (w <= 28) return 5 + ((w - 23) / 5) * 4; // 5 → 9%
    return Math.min(15, 9 + (w - 28) * 0.8); // >9%, capped at 15%
  }

  /** Heat-risk band from shade WBGT. */
  static risk(wbgtC: number): TEnvRisk {
    if (wbgtC < 18) return 'low';
    if (wbgtC < 23) return 'moderate';
    if (wbgtC < 28) return 'high';
    return 'extreme';
  }

  /**
   * Minetti (2002) metabolic cost of running on a gradient, normalised to flat.
   * @param gradePct gradient in percent (e.g. 5 = 5% uphill, -5 = downhill).
   *        Clamped to the validated ±45% range.
   * @returns pace multiplier vs flat ground (1.0 = flat).
   */
  static gradeFactor(gradePct: number): number {
    const i = Math.max(-0.45, Math.min(0.45, (gradePct || 0) / 100));
    const cost = 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6;
    const flat = 3.6;
    return cost / flat;
  }

  /** Adjust a base pace (sec/km) for environment + a single-segment grade. */
  static adjust(basePaceSec: number, tempC: number, rhPct: number, gradePct = 0): IEnvAdjustment {
    const dewPointC = this.dewPoint(tempC, rhPct);
    const wbgtC = this.wbgtShade(tempC, rhPct);
    const heatPct = this.heatSlowdownPct(tempC, rhPct);
    const gradeFactor = this.gradeFactor(gradePct);
    const base = basePaceSec > 0 ? basePaceSec : 0;
    const adjustedPaceSec = base * (1 + heatPct / 100) * gradeFactor;
    return {
      dewPointC: Math.round(dewPointC * 10) / 10,
      wbgtC: Math.round(wbgtC * 10) / 10,
      heatPct: Math.round(heatPct * 10) / 10,
      gradeFactor: Math.round(gradeFactor * 1000) / 1000,
      adjustedPaceSec: Math.round(adjustedPaceSec),
      risk: this.risk(wbgtC)
    };
  }
}

export default EnvironmentalPaceCalculator;
