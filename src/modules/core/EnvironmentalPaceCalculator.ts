/**
 * EnvironmentalPaceCalculator
 * Adjusts a pace for heat/humidity, slope and heat acclimatisation, in either
 * direction.
 *  - Dew point: Magnus formula.
 *  - WBGT (shade): Australian Bureau of Meteorology approximation
 *    (WBGT ≈ 0.567·T + 0.393·e + 3.94, e = water-vapour pressure).
 *  - Heat slowdown %: piecewise mapping of WBGT to performance loss
 *    (Ely 2007; El Helou 2012; Mantzios 2022 — endurance pace degrades as WBGT rises).
 *  - Acclimatisation: scales the heat penalty down for adapted runners
 *    (Périard, Racinais & Sawka 2015 — ~7–14 days of heat exposure attenuates
 *    the decrement). Heuristic multipliers, surfaced to the athlete as such.
 *  - Grade factor: Minetti et al. 2002 metabolic cost of gradient running.
 *  - Mode: 'forward' predicts the hot/hilly pace from a flat-cool target;
 *    'reverse' backs out the flat-cool-equivalent pace from one run in the heat
 *    (the model-consistent inverse of forward, not a separate claim).
 */

export type TEnvRisk = 'low' | 'moderate' | 'high' | 'extreme';
export type TAcclim = 'none' | 'partial' | 'full';
export type TEnvMode = 'forward' | 'reverse';

export interface IEnvAdjustment {
  dewPointC: number;
  wbgtC: number;
  heatPct: number; // % slower due to heat/humidity, after acclimatisation
  gradeFactor: number; // pace multiplier vs flat (1.0 = flat ground)
  adjustedPaceSec: number; // result pace for the chosen mode (sec/km)
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

  /**
   * Heat-acclimatisation multiplier on the heat penalty. Heuristic: adapted
   * runners suffer a smaller decrement (Périard, Racinais & Sawka 2015 — most
   * adaptation lands within ~7–14 days). Conservative — it never zeroes the
   * penalty, since acclimatisation attenuates but does not remove heat strain.
   */
  private static acclimFactor(a: TAcclim): number {
    return a === 'full' ? 0.5 : a === 'partial' ? 0.75 : 1;
  }

  /**
   * Adjust a pace (sec/km) for environment + a single-segment grade.
   * @param acclim heat-acclimatisation status (scales the heat penalty down).
   * @param mode 'forward' = predict the hot/hilly pace from a flat-cool pace;
   *        'reverse' = back out the flat-cool-equivalent pace from a pace run in
   *        the heat. `adjustedPaceSec` holds the result for the chosen mode.
   */
  static adjust(
    paceSec: number,
    tempC: number,
    rhPct: number,
    gradePct = 0,
    acclim: TAcclim = 'none',
    mode: TEnvMode = 'forward'
  ): IEnvAdjustment {
    const dewPointC = this.dewPoint(tempC, rhPct);
    const wbgtC = this.wbgtShade(tempC, rhPct);
    const heatPct = this.heatSlowdownPct(tempC, rhPct) * this.acclimFactor(acclim);
    const gradeFactor = this.gradeFactor(gradePct);
    const mult = (1 + heatPct / 100) * gradeFactor;
    const p = paceSec > 0 ? paceSec : 0;
    const adjustedPaceSec = mode === 'reverse' ? (mult > 0 ? p / mult : 0) : p * mult;
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
