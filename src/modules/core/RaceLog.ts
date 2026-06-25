/**
 * RaceLog
 * Pure helpers for a log of past race results → a VDOT fitness trend and
 * per-distance personal bests. DOM-free and storage-free (see RaceLogStore for
 * persistence). VDOT is derived from each result via VdotCalculator.
 */

import VdotCalculator from './VdotCalculator.js';

export interface IRaceEntry {
  id: string;
  date: string; // YYYY-MM-DD
  distanceMeters: number;
  timeSec: number;
}

export interface IRaceTrendPoint {
  date: string;
  vdot: number;
}

export interface IRacePb {
  distanceMeters: number;
  entry: IRaceEntry;
  paceSec: number; // sec/km of the PB
  vdot: number;
}

export interface IRaceAnalysis {
  vdotTrend: IRaceTrendPoint[];
  pbByDistance: IRacePb[];
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const round1 = (n: number): number => Math.round(n * 10) / 10;

export class RaceLog {
  /** A result is valid with an ISO date, a positive distance and a positive time. */
  static validate(e: Partial<IRaceEntry> | null | undefined): boolean {
    return (
      !!e &&
      typeof e.date === 'string' &&
      ISO_DATE.test(e.date) &&
      typeof e.distanceMeters === 'number' &&
      e.distanceMeters > 0 &&
      typeof e.timeSec === 'number' &&
      e.timeSec > 0
    );
  }

  /** Stable id derived from the result so identical entries dedupe naturally. */
  static makeId(e: Pick<IRaceEntry, 'date' | 'distanceMeters' | 'timeSec'>): string {
    return `${e.date}:${Math.round(e.distanceMeters)}:${Math.round(e.timeSec)}`;
  }

  /** Insert or replace by id; returns a new date-sorted list. Invalid → unchanged. */
  static upsert(list: IRaceEntry[], e: IRaceEntry): IRaceEntry[] {
    if (!this.validate(e)) return list.slice();
    const id = e.id || this.makeId(e);
    const next = list.filter((x) => x.id !== id);
    next.push({ ...e, id });
    return this.sortByDate(next);
  }

  static remove(list: IRaceEntry[], id: string): IRaceEntry[] {
    return list.filter((x) => x.id !== id);
  }

  static sortByDate(list: IRaceEntry[]): IRaceEntry[] {
    return list.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }

  /** Union two logs by id (append-only merge for cross-device cloud sync). */
  static merge(a: IRaceEntry[], b: IRaceEntry[]): IRaceEntry[] {
    const byId = new Map<string, IRaceEntry>();
    for (const e of [...a, ...b]) {
      if (this.validate(e) && e.id) byId.set(e.id, e);
    }
    return this.sortByDate(Array.from(byId.values()));
  }

  /** VDOT trend over time + best result per distance. */
  static analyze(list: IRaceEntry[]): IRaceAnalysis {
    const valid = this.sortByDate(list.filter((e) => this.validate(e)));
    const vdotTrend: IRaceTrendPoint[] = valid.map((e) => ({
      date: e.date,
      vdot: round1(VdotCalculator.vdotFromRace(e.distanceMeters, e.timeSec))
    }));

    const best = new Map<number, { entry: IRaceEntry; vdot: number }>();
    for (const e of valid) {
      const vdot = VdotCalculator.vdotFromRace(e.distanceMeters, e.timeSec);
      const cur = best.get(e.distanceMeters);
      if (!cur || vdot > cur.vdot) best.set(e.distanceMeters, { entry: e, vdot });
    }
    const pbByDistance: IRacePb[] = Array.from(best.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([distanceMeters, { entry, vdot }]) => ({
        distanceMeters,
        entry,
        paceSec: Math.round(entry.timeSec / (distanceMeters / 1000)),
        vdot: round1(vdot)
      }));

    return { vdotTrend, pbByDistance };
  }
}

export default RaceLog;
