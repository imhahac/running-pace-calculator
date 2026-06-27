/**
 * WellnessCalculator
 * Subjective daily-wellness score from four self-reported factors — sleep
 * quality, muscle soreness, perceived stress and mood. A systematic review found
 * subjective self-report tracks acute and chronic training load with greater
 * sensitivity and consistency than commonly used objective markers (Saw et al.
 * 2016, Br J Sports Med). Each factor is a 3-level severity (0 best → 2 worst);
 * a present factor maps to a 0–100 sub-score and the wellness is their average.
 * MISSING factors are 'na' and excluded, so the score is useful even when only
 * some are filled. Deliberately a TRANSPARENT heuristic: there is no published
 * weighting for these factors, so this is a starting point, not a precise dose.
 */

export type TWellnessKey = 'sleep' | 'soreness' | 'stress' | 'mood';
export type TWellnessState = 'good' | 'ok' | 'bad' | 'na';

export interface IWellnessInput {
  /** Severity 0 (best) | 1 | 2 (worst) per factor; undefined/null = not reported. */
  sleep?: number | null;
  soreness?: number | null;
  stress?: number | null;
  mood?: number | null;
}

export interface IWellnessFactor {
  key: TWellnessKey;
  score: number | null; // null = not reported
  state: TWellnessState;
}

export interface IWellness {
  score: number | null; // 0–100; null when nothing reported
  present: number;
  factors: IWellnessFactor[];
}

// Severity → sub-score: 0 best, 1 middling, 2 poor.
const SEVERITY_SCORE = [100, 65, 30];
const stateOf = (s: number): TWellnessState => (s >= 80 ? 'good' : s >= 55 ? 'ok' : 'bad');

const sub = (sev?: number | null): number | null => {
  if (sev === null || sev === undefined || !isFinite(sev)) return null;
  const i = Math.round(sev);
  return i >= 0 && i <= 2 ? SEVERITY_SCORE[i] : null;
};

const ORDER: TWellnessKey[] = ['sleep', 'soreness', 'stress', 'mood'];

export class WellnessCalculator {
  static score(input: IWellnessInput): IWellness {
    const factors: IWellnessFactor[] = ORDER.map((key) => {
      const s = sub(input[key]);
      return { key, score: s, state: s === null ? 'na' : stateOf(s) };
    });
    const present = factors.map((f) => f.score).filter((s): s is number => s !== null);
    if (!present.length) return { score: null, present: 0, factors };
    const score = Math.round(present.reduce((a, b) => a + b, 0) / present.length);
    return { score, present: present.length, factors };
  }
}

export default WellnessCalculator;
