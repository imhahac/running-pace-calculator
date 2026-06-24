/**
 * FormPersistence
 * Lightweight localStorage persistence for the science/environment tool inputs
 * (which are otherwise ephemeral). Restore values on load, then autosave on
 * input/change. Self-contained and guarded so it is a no-op without
 * localStorage (e.g. in Node tests).
 */

const STORAGE_KEY = 'rpc_tool_inputs';

/** Inputs of the Phase 1–4 science/environment tools (persisted + synced). */
export const TOOL_INPUT_IDS = [
  'env-mode-select',
  'env-temp-input',
  'env-humidity-input',
  'env-pace-input',
  'env-grade-input',
  'env-acclim-select',
  'acwr-w1',
  'acwr-w2',
  'acwr-w3',
  'acwr-w4',
  'acwr-strength',
  'acwr-shoes',
  'cadence-pace-input',
  'cadence-current-input',
  'strides-week-input',
  'fuel-weight-input',
  'fuel-dist-select',
  'fuel-time-input',
  'sweat-weight-input',
  'sweat-pace-input',
  'sweat-dist-input',
  'sweat-temp-input',
  'sweat-humidity-input',
  'glyco-weight-input',
  'glyco-protocol-select',
  'glyco-dist-select',
  'glyco-time-input',
  'cool-weight-input',
  'cool-temp-input',
  'cool-humidity-input',
  'rec-dist-select',
  'rec-effort-select',
  'rec-age-input',
  'rec-time-input',
  'taper-peak-input',
  'taper-weeks-select',
  'gap-pace-input',
  'gap-maxhr-input',
  'gap-resthr-input',
  're-5k-input',
  're-sex-select',
  're-bf-input',
  'hrv-input',
  'cycle-start-date',
  'cycle-day-input',
  'cycle-length-input',
  'cycle-dysmenorrhea-select',
  'cycle-mood-select',
  'cycle-sleep-input',
  'alt-altitude-input',
  'alt-days-input',
  'alt-hours-input',
  'alt-protocol-select',
  // Assessment / workout / training-cycle tool inputs (pace_* and tri-* are
  // owned by StateManager and intentionally excluded to avoid restore clashes).
  'hr-age-input',
  'hr-rest-input',
  'hr-max-input',
  'hr-formula-select',
  'vdot-dist-select',
  'vdot-time-input',
  'pred-dist-select',
  'pred-time-input',
  'raceplan-dist-select',
  'raceplan-time-input',
  'raceplan-strategy-select',
  'interval-weekly-input',
  'interval-type-select',
  'interval-goal-select',
  'interval-phase-select',
  'interval-qdays-input',
  'methods-time-input',
  'methods-select',
  'training-target-date',
  'training-plan-distance',
  'training-difficulty',
  'training-school',
  'training-weeks',
  'training-start-vol',
  'training-peak-vol'
];

function getStore(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function readAll(): Record<string, string> {
  const store = getStore();
  if (!store) return {};
  try {
    const raw = store.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export class FormPersistence {
  /** Restore saved values into the given input/select elements. */
  static restore(ids: string[]): void {
    const data = readAll();
    ids.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (el && el.type !== 'file' && typeof data[id] === 'string' && data[id] !== '') {
        el.value = data[id];
      }
    });
  }

  /** Persist the current values of the given elements. */
  static save(ids: string[]): void {
    const store = getStore();
    if (!store) return;
    const data: Record<string, string> = {};
    ids.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (el && el.type !== 'file' && el.value) data[id] = el.value;
    });
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota / disabled storage — ignore */
    }
  }

  /**
   * Collect current values of the given elements (skips file inputs).
   * @param includeEmpty when true, emit '' for cleared fields so a cloud-sync
   * push can propagate deletions; default false keeps share URLs / storage lean.
   */
  static snapshot(ids: string[], includeEmpty = false): Record<string, string> {
    const out: Record<string, string> = {};
    ids.forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (!el || el.type === 'file') return;
      if (el.value) out[id] = el.value;
      else if (includeEmpty) out[id] = '';
    });
    return out;
  }

  /**
   * Apply a values map to elements. When `dispatch` is true, fire input/change
   * events so the owning controllers recompute (used after a cloud-sync pull).
   */
  static apply(values: Record<string, string>, dispatch = false): void {
    if (!values || typeof values !== 'object') return;
    Object.keys(values).forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (!el || el.type === 'file' || typeof values[id] !== 'string') return;
      el.value = values[id];
      if (dispatch && typeof Event !== 'undefined') {
        const evt = el.tagName === 'SELECT' ? 'change' : 'input';
        el.dispatchEvent(new Event(evt, { bubbles: true }));
      }
    });
  }

  /** Autosave on every input/change of the given elements. */
  static bindAutosave(ids: string[]): void {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (): void => this.save(ids);
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
  }
}

export default FormPersistence;
