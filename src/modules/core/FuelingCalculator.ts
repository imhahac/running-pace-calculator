/**
 * FuelingCalculator
 * Energy expenditure and an in-race fueling timeline. Running burns roughly
 * 1.036 kcal per kg per km (gross). In-race carbohydrate targets follow ACSM /
 * Stellingwerff & Cox (2014): ~30 g/h for 1–2 h, ~60 g/h for 2–2.5 h, up to
 * ~90 g/h (multiple transportable carbs) beyond ~2.5 h. Fluid ≈ 500 ml/h.
 */

export interface IFuelStation {
  km: number;
  timeSec: number;
  fluidMl: number;
  carbG: number;
}

export interface IFuelPlan {
  totalKcal: number;
  carbRateGh: number;
  fluidRateMlh: number;
  totalCarbG: number;
  stations: IFuelStation[];
}

export class FuelingCalculator {
  static readonly KCAL_PER_KG_KM = 1.036;
  static readonly FLUID_ML_PER_H = 500;

  /** Gross running energy cost (kcal). */
  static calories(weightKg: number, distanceKm: number): number {
    if (weightKg <= 0 || distanceKm <= 0) return 0;
    return Math.round(this.KCAL_PER_KG_KM * weightKg * distanceKm);
  }

  /** Recommended in-race carbohydrate rate (g/h) by total duration (minutes). */
  static carbRate(durationMin: number): number {
    if (durationMin < 60) return 0;
    if (durationMin < 120) return 30;
    if (durationMin < 150) return 60;
    return 90;
  }

  /** Build a per-station fueling timeline for a race. */
  static plan(distanceKm: number, finishSec: number, weightKg: number, stepKm = 5): IFuelPlan {
    const durationMin = finishSec / 60;
    const carbRateGh = this.carbRate(durationMin);
    const stations: IFuelStation[] = [];

    if (distanceKm > 0 && finishSec > 0) {
      const pacePerKm = finishSec / distanceKm;
      const marks: number[] = [];
      for (let d = stepKm; d < distanceKm - 1e-6; d += stepKm) marks.push(d);
      marks.push(distanceKm); // always finish at the line

      let prevTime = 0;
      marks.forEach((km) => {
        const timeSec = km * pacePerKm;
        const intervalH = (timeSec - prevTime) / 3600;
        // Carbohydrate only once past the first ~45 minutes.
        const carbG = timeSec >= 2700 ? Math.round(carbRateGh * intervalH) : 0;
        const fluidMl = Math.round(this.FLUID_ML_PER_H * intervalH);
        stations.push({
          km: Math.round(km * 10) / 10,
          timeSec: Math.round(timeSec),
          fluidMl,
          carbG
        });
        prevTime = timeSec;
      });
    }

    const totalCarbG = stations.reduce((sum, st) => sum + st.carbG, 0);
    return {
      totalKcal: this.calories(weightKg, distanceKm),
      carbRateGh,
      fluidRateMlh: this.FLUID_ML_PER_H,
      totalCarbG,
      stations
    };
  }
}

export default FuelingCalculator;
