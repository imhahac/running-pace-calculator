/**
 * RaceLogStore
 * localStorage persistence for the race-results log (`rpc_race_log`). Pure log
 * logic lives in RaceLog; this just reads/writes the array, tolerating corrupt
 * data. The log also rides the cloud-sync blob (see SyncController).
 */

import StorageManager from './StorageManager.js';
import RaceLog, { type IRaceEntry } from '../core/RaceLog.js';

const KEY = 'rpc_race_log';

export class RaceLogStore {
  static all(): IRaceEntry[] {
    try {
      const raw = StorageManager.get(KEY);
      if (!raw) return [];
      const v = JSON.parse(raw);
      return Array.isArray(v) ? RaceLog.sortByDate(v.filter((e) => RaceLog.validate(e))) : [];
    } catch {
      return [];
    }
  }

  static replace(list: IRaceEntry[]): void {
    StorageManager.set(
      KEY,
      JSON.stringify(RaceLog.sortByDate(list.filter((e) => RaceLog.validate(e))))
    );
  }

  static add(entry: IRaceEntry): IRaceEntry[] {
    const next = RaceLog.upsert(this.all(), entry);
    this.replace(next);
    return next;
  }

  static remove(id: string): IRaceEntry[] {
    const next = RaceLog.remove(this.all(), id);
    this.replace(next);
    return next;
  }
}

export default RaceLogStore;
