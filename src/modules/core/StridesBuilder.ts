/**
 * StridesBuilder
 * Strides ("加速段"): ~15–30 s of controlled fast (not maximal) running with
 * full recovery, run 2–3×/week. They improve neuromuscular coordination and
 * running economy (Daniels & Gilbert 1979; Blagrove 2018). This builds a
 * 12-week progression from 4×15 s up to 8×30 s. When a repetition (R) pace is
 * supplied (from VDOT), each session also reports that target pace and the
 * approximate distance covered per stride.
 */

export interface IStrideSession {
  week: number;
  reps: number;
  durationSec: number;
  recoverySec: number;
  /** Target stride pace (sec/km) — repetition (R) pace; set only when known. */
  repPaceSec?: number;
  /** Approx metres covered per stride at that pace; set only when known. */
  distancePerStrideM?: number;
}

export class StridesBuilder {
  static readonly TOTAL_WEEKS = 12;

  /**
   * Stride session for a given week (1–12) of progression.
   * @param repPaceSec optional repetition (R) pace in sec/km — strides are run
   *   at roughly R/1500–mile effort, so this is the target pace.
   */
  static session(week: number, repPaceSec?: number): IStrideSession {
    const w = Math.min(this.TOTAL_WEEKS, Math.max(1, Math.floor(week) || 1));
    const reps = Math.min(8, 4 + Math.floor((w - 1) / 2)); // 4 → 8 reps
    const durationSec = Math.min(30, 15 + Math.floor((w - 1) / 3) * 5); // 15 → 30 s
    const recoverySec = durationSec * 3; // full recovery ≈ 3× the effort
    const out: IStrideSession = { week: w, reps, durationSec, recoverySec };
    if (repPaceSec && repPaceSec > 0) {
      out.repPaceSec = repPaceSec;
      // distance = duration × speed; speed (m/s) = 1000 / paceSecPerKm.
      out.distancePerStrideM = Math.round((durationSec * 1000) / repPaceSec);
    }
    return out;
  }

  /** Full 12-week progression (optionally with the R-pace target on each row). */
  static progression(repPaceSec?: number): IStrideSession[] {
    const out: IStrideSession[] = [];
    for (let w = 1; w <= this.TOTAL_WEEKS; w += 1) out.push(this.session(w, repPaceSec));
    return out;
  }
}

export default StridesBuilder;
