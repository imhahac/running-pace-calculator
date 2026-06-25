/**
 * ReadinessCalculator
 * Synthesises a single daily training-readiness score from up to three signals
 * the app already computes — HRV status, ACWR load zone, and recovery debt.
 * Pure and dependency-free (callers pass the other tools' outputs). Deliberately
 * a TRANSPARENT heuristic, not a validated index: each present factor maps to a
 * 0–100 sub-score and the readiness is their average; MISSING factors are 'na'
 * and simply excluded (so the dashboard is useful even when partly filled).
 */

export type THrvStatusIn = 'low' | 'normal' | 'high';
export type TAcwrZoneIn = 'undertraining' | 'sweet' | 'caution' | 'highrisk';
export type TFactorKey = 'hrv' | 'acwr' | 'recovery';
export type TFactorState = 'good' | 'ok' | 'bad' | 'na';
export type TReadinessLevel = 'go' | 'caution' | 'easy' | 'rest';

export interface IReadinessInput {
  hrvStatus?: THrvStatusIn | null;
  acwrZone?: TAcwrZoneIn | null;
  /** RecoveryCalculator.beforeHardDays for the last logged hard effort, or null. */
  recoveryDays?: number | null;
}

export interface IReadinessFactor {
  key: TFactorKey;
  score: number | null; // null = not available
  state: TFactorState;
}

export interface IReadiness {
  score: number | null; // 0–100; null when no factor is available
  level: TReadinessLevel | null;
  factors: IReadinessFactor[];
}

const stateOf = (s: number): TFactorState => (s >= 80 ? 'good' : s >= 55 ? 'ok' : 'bad');

export class ReadinessCalculator {
  static hrvScore(status?: THrvStatusIn | null): number | null {
    return status === 'normal' ? 100 : status === 'high' ? 85 : status === 'low' ? 40 : null;
  }

  static acwrScore(zone?: TAcwrZoneIn | null): number | null {
    switch (zone) {
      case 'sweet':
        return 100;
      case 'undertraining':
        return 80;
      case 'caution':
        return 60;
      case 'highrisk':
        return 30;
      default:
        return null;
    }
  }

  /** More recommended recovery days before hard training → lower readiness. */
  static recoveryScore(days?: number | null): number | null {
    if (days === null || days === undefined || !(days >= 0)) return null;
    return days <= 1 ? 100 : days <= 3 ? 70 : 45;
  }

  static compute(input: IReadinessInput): IReadiness {
    const raw: { key: TFactorKey; score: number | null }[] = [
      { key: 'hrv', score: this.hrvScore(input.hrvStatus) },
      { key: 'acwr', score: this.acwrScore(input.acwrZone) },
      { key: 'recovery', score: this.recoveryScore(input.recoveryDays) }
    ];
    const factors: IReadinessFactor[] = raw.map((f) => ({
      key: f.key,
      score: f.score,
      state: f.score === null ? 'na' : stateOf(f.score)
    }));
    const present = raw.map((f) => f.score).filter((s): s is number => s !== null);
    if (!present.length) return { score: null, level: null, factors };
    const score = Math.round(present.reduce((a, b) => a + b, 0) / present.length);
    const level: TReadinessLevel =
      score >= 80 ? 'go' : score >= 60 ? 'caution' : score >= 40 ? 'easy' : 'rest';
    return { score, level, factors };
  }
}

export default ReadinessCalculator;
