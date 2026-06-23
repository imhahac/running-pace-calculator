/**
 * StridesBuilder
 * Strides ("加速段"): ~15–30 s of controlled fast (not maximal) running with
 * full recovery, run 2–3×/week. They improve neuromuscular coordination and
 * running economy (Daniels & Gilbert 1979; Blagrove 2018). This builds a
 * 12-week progression from 4×15 s up to 8×30 s.
 */

export interface IStrideSession {
  week: number;
  reps: number;
  durationSec: number;
  recoverySec: number;
}

export class StridesBuilder {
  static readonly TOTAL_WEEKS = 12;

  /** Stride session for a given week (1–12) of progression. */
  static session(week: number): IStrideSession {
    const w = Math.min(this.TOTAL_WEEKS, Math.max(1, Math.floor(week) || 1));
    const reps = Math.min(8, 4 + Math.floor((w - 1) / 2)); // 4 → 8 reps
    const durationSec = Math.min(30, 15 + Math.floor((w - 1) / 3) * 5); // 15 → 30 s
    const recoverySec = durationSec * 3; // full recovery ≈ 3× the effort
    return { week: w, reps, durationSec, recoverySec };
  }

  /** Full 12-week progression. */
  static progression(): IStrideSession[] {
    const out: IStrideSession[] = [];
    for (let w = 1; w <= this.TOTAL_WEEKS; w += 1) out.push(this.session(w));
    return out;
  }
}

export default StridesBuilder;
