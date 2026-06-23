/**
 * SweatRateCalculator
 * Estimates sweat rate and personalised hydration/electrolyte/carb needs for a
 * long run. The gold standard is pre/post weighing; here sweat loss is derived
 * from running heat production: ~80% of running energy becomes heat, and
 * evaporating 1 L of sweat dissipates ~580 kcal. Hot/humid air evaporates
 * sweat less efficiently, so more is lost (Périard 2015). Sweat sodium ≈ 1 g/L;
 * replace ~75% of losses during exercise to avoid over-drinking (hyponatraemia).
 * Carbohydrate targets reuse FuelingCalculator (Stellingwerff & Cox 2014).
 */

import EnvironmentalPaceCalculator from './EnvironmentalPaceCalculator.js';
import FuelingCalculator from './FuelingCalculator.js';

export interface ISweatStation {
  km: number;
  timeSec: number;
  fluidMl: number;
  carbG: number;
  sodiumMg: number;
}

export interface ISweatPlan {
  sweatRateLh: number;
  fluidRateMlh: number;
  sodiumRateMgh: number;
  carbRateGh: number;
  stations: ISweatStation[];
}

export class SweatRateCalculator {
  static readonly EVAP_KCAL_PER_L = 580;
  static readonly HEAT_FRACTION = 0.8;
  static readonly SWEAT_SODIUM_G_PER_L = 1.0;
  static readonly REPLACE_FRACTION = 0.75;

  /** Estimated sweat rate (L/h). */
  static sweatRateLh(weightKg: number, paceSecPerKm: number, tempC: number, rhPct: number): number {
    if (weightKg <= 0 || paceSecPerKm <= 0) return 0;
    const speedKmh = 3600 / paceSecPerKm;
    const kcalPerH = FuelingCalculator.KCAL_PER_KG_KM * weightKg * speedKmh;
    const heatLoad = this.HEAT_FRACTION * kcalPerH;
    const base = heatLoad / this.EVAP_KCAL_PER_L;
    const wbgt = EnvironmentalPaceCalculator.wbgtShade(tempC, rhPct);
    const envMult = 1 + Math.max(0, wbgt - 18) * 0.03;
    return Math.round(base * envMult * 100) / 100;
  }

  /** Personalised per-station hydration/fuel plan for a long run/race. */
  static plan(
    weightKg: number,
    paceSecPerKm: number,
    distanceKm: number,
    tempC: number,
    rhPct: number,
    stepKm = 5
  ): ISweatPlan {
    const sweatRateLh = this.sweatRateLh(weightKg, paceSecPerKm, tempC, rhPct);
    const fluidRateMlh = Math.round(sweatRateLh * this.REPLACE_FRACTION * 1000);
    const sodiumRateMgh = Math.round(sweatRateLh * this.SWEAT_SODIUM_G_PER_L * 1000);
    const durationMin = (paceSecPerKm * distanceKm) / 60;
    const carbRateGh = FuelingCalculator.carbRate(durationMin);

    const stations: ISweatStation[] = [];
    if (distanceKm > 0 && paceSecPerKm > 0) {
      const marks: number[] = [];
      for (let d = stepKm; d < distanceKm - 1e-6; d += stepKm) marks.push(d);
      marks.push(distanceKm);

      let prevTime = 0;
      marks.forEach((km) => {
        const timeSec = km * paceSecPerKm;
        const intervalH = (timeSec - prevTime) / 3600;
        stations.push({
          km: Math.round(km * 10) / 10,
          timeSec: Math.round(timeSec),
          fluidMl: Math.round(fluidRateMlh * intervalH),
          carbG: timeSec >= 2700 ? Math.round(carbRateGh * intervalH) : 0,
          sodiumMg: Math.round(sodiumRateMgh * intervalH)
        });
        prevTime = timeSec;
      });
    }

    return { sweatRateLh, fluidRateMlh, sodiumRateMgh, carbRateGh, stations };
  }
}

export default SweatRateCalculator;
