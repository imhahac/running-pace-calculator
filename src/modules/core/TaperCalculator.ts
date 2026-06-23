/**
 * TaperCalculator
 * Pre-race taper schedule (Mujika 2003/2010; Bosquet 2007 meta-analysis):
 * progressively cut weekly VOLUME ~40–60% over 1–3 weeks while KEEPING
 * intensity and frequency, for a typical ~1–3% performance gain.
 */

export interface ITaperWeek {
  weeksOut: number; // 1 = race week
  volumePct: number; // % of peak weekly volume
  volumeKm: number;
}

export interface ITaperPlan {
  taperWeeks: number;
  peakWeeklyKm: number;
  weeks: ITaperWeek[];
}

const TABLES: Record<number, { weeksOut: number; pct: number }[]> = {
  1: [{ weeksOut: 1, pct: 55 }],
  2: [
    { weeksOut: 2, pct: 70 },
    { weeksOut: 1, pct: 50 }
  ],
  3: [
    { weeksOut: 3, pct: 80 },
    { weeksOut: 2, pct: 60 },
    { weeksOut: 1, pct: 45 }
  ]
};

export class TaperCalculator {
  static plan(peakWeeklyKm: number, taperWeeks = 2): ITaperPlan {
    const t = Math.min(3, Math.max(1, Math.round(taperWeeks) || 2));
    const peak = peakWeeklyKm > 0 ? peakWeeklyKm : 0;
    const weeks: ITaperWeek[] = TABLES[t].map((row) => ({
      weeksOut: row.weeksOut,
      volumePct: row.pct,
      volumeKm: Math.round((peak * row.pct) / 100)
    }));
    return { taperWeeks: t, peakWeeklyKm: peak, weeks };
  }
}

export default TaperCalculator;
