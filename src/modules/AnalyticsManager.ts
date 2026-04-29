/**
 * AnalyticsManager Module
 * Lightweight local-only usage analytics for UX improvements.
 */

import StorageManager from './StorageManager.js';

const ANALYTICS_STORAGE_KEY = 'runningPaceNoteAnalytics';

type TMode = 'pace' | 'track' | 'treadmill' | 'finish_time';

type TAnalyticsState = {
  totals: {
    calcSuccess: number;
    calcRejected: number;
    finishValid: number;
    finishInvalid: number;
  };
  bySource: Record<string, number>;
  byMode: Record<string, number>;
  byRejectReason: Record<string, number>;
  byFinishExpectedFormat: {
    short: number;
    long: number;
  };
  updatedAt: string;
};

const DEFAULT_ANALYTICS: TAnalyticsState = {
  totals: {
    calcSuccess: 0,
    calcRejected: 0,
    finishValid: 0,
    finishInvalid: 0
  },
  bySource: {},
  byMode: {},
  byRejectReason: {},
  byFinishExpectedFormat: {
    short: 0,
    long: 0
  },
  updatedAt: new Date(0).toISOString()
};

function safeIncrement(map: Record<string, number>, key: string): void {
  map[key] = (map[key] || 0) + 1;
}

export class AnalyticsManager {
  private static readState(): TAnalyticsState {
    const raw = StorageManager.get(ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULT_ANALYTICS,
        updatedAt: new Date().toISOString()
      };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<TAnalyticsState>;
      return {
        totals: {
          calcSuccess: parsed.totals?.calcSuccess || 0,
          calcRejected: parsed.totals?.calcRejected || 0,
          finishValid: parsed.totals?.finishValid || 0,
          finishInvalid: parsed.totals?.finishInvalid || 0
        },
        bySource: parsed.bySource || {},
        byMode: parsed.byMode || {},
        byRejectReason: parsed.byRejectReason || {},
        byFinishExpectedFormat: {
          short: parsed.byFinishExpectedFormat?.short || 0,
          long: parsed.byFinishExpectedFormat?.long || 0
        },
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    } catch {
      return {
        ...DEFAULT_ANALYTICS,
        updatedAt: new Date().toISOString()
      };
    }
  }

  private static writeState(state: TAnalyticsState): void {
    state.updatedAt = new Date().toISOString();
    StorageManager.set(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  }

  static trackCalculationSuccess(sourceId: string, mode: TMode): void {
    const state = this.readState();
    state.totals.calcSuccess += 1;
    safeIncrement(state.bySource, sourceId);
    safeIncrement(state.byMode, mode);
    this.writeState(state);
  }

  static trackCalculationRejected(sourceId: string, mode: TMode, reason: string): void {
    const state = this.readState();
    state.totals.calcRejected += 1;
    safeIncrement(state.bySource, sourceId);
    safeIncrement(state.byMode, mode);
    safeIncrement(state.byRejectReason, reason);
    this.writeState(state);
  }

  static trackFinishTimeValidation(isValid: boolean, expectedFormat: 'm:ss' | 'h:mm:ss'): void {
    const state = this.readState();

    if (isValid) {
      state.totals.finishValid += 1;
    } else {
      state.totals.finishInvalid += 1;
    }

    if (expectedFormat === 'h:mm:ss') {
      state.byFinishExpectedFormat.long += 1;
    } else {
      state.byFinishExpectedFormat.short += 1;
    }

    this.writeState(state);
  }

  static getSummary(): TAnalyticsState {
    return this.readState();
  }

  static clear(): void {
    StorageManager.set(ANALYTICS_STORAGE_KEY, JSON.stringify({
      ...DEFAULT_ANALYTICS,
      updatedAt: new Date().toISOString()
    }));
  }
}

export default AnalyticsManager;
