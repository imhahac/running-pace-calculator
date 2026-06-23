import { FULL_MARATHON_METERS, HALF_MARATHON_METERS, VENUES } from '../../../constants/index.js';
import TrainingCycleManager from '../TrainingCycleManager.js';
import StateManager from '../../state/StateManager.js';
import TranslationManager from '../../state/TranslationManager.js';

export class TrainingController {
  static refreshTrainingCycleUI(paceSecondsPerKm: number): void {
    if (paceSecondsPerKm > 0) {
      TrainingCycleManager.update(paceSecondsPerKm);
    }
  }

  /** Difficulty presets fill the weeks / start / peak volume fields. */
  static applyDifficultyPreset(): void {
    const sel = document.getElementById('training-difficulty') as HTMLSelectElement | null;
    if (!sel) return;
    const presets: Record<string, { weeks: number; start: number; peak: number }> = {
      beginner: { weeks: 16, start: 25, peak: 45 },
      intermediate: { weeks: 16, start: 40, peak: 70 },
      elite: { weeks: 18, start: 60, peak: 110 }
    };
    const preset = presets[sel.value];
    if (!preset) return;
    const setVal = (id: string, v: number): void => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = String(v);
    };
    setVal('training-weeks', preset.weeks);
    setVal('training-start-vol', preset.start);
    setVal('training-peak-vol', preset.peak);
  }

  /**
   * Named-school presets (Higdon / Pfitzinger / Daniels) bias the volume profile
   * by filling the same weeks/start/peak fields, and show the school's approach.
   * Empty value ("自動") leaves the fields untouched.
   */
  static applySchoolPreset(): void {
    const sel = document.getElementById('training-school') as HTMLSelectElement | null;
    if (!sel) return;
    const descEl = document.getElementById('training-school-desc');
    if (descEl) descEl.textContent = TranslationManager.get(`school_desc_${sel.value || 'none'}`);

    const presets: Record<string, { weeks: number; start: number; peak: number }> = {
      higdon: { weeks: 18, start: 30, peak: 55 },
      pfitzinger: { weeks: 18, start: 45, peak: 90 },
      daniels: { weeks: 18, start: 40, peak: 70 }
    };
    const preset = presets[sel.value];
    if (!preset) return;
    const setVal = (id: string, v: number): void => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = String(v);
    };
    setVal('training-weeks', preset.weeks);
    setVal('training-start-vol', preset.start);
    setVal('training-peak-vol', preset.peak);
  }

  static populateSettingsPanel(): void {
    const state = StateManager.getState();
    const t = TranslationManager.getDict();

    const langSelect = document.getElementById('settings-lang') as HTMLSelectElement | null;
    const paceUnitSelect = document.getElementById(
      'settings-pace-unit'
    ) as HTMLSelectElement | null;
    const treadmillUnitSelect = document.getElementById(
      'settings-treadmill-unit'
    ) as HTMLSelectElement | null;
    const splitModeSelect = document.getElementById(
      'settings-split-mode'
    ) as HTMLSelectElement | null;
    const venueSelect = document.getElementById('settings-venue') as HTMLSelectElement | null;

    if (langSelect) {
      langSelect.innerHTML = '';
      langSelect.appendChild(new Option(TranslationManager.getOptionLabel('language', 'zh'), 'zh'));
      langSelect.appendChild(new Option(TranslationManager.getOptionLabel('language', 'en'), 'en'));
      langSelect.value = state.lang;
    }

    if (paceUnitSelect) {
      paceUnitSelect.innerHTML = '';
      paceUnitSelect.appendChild(
        new Option(TranslationManager.getOptionLabel('paceUnit', 'km'), 'km')
      );
      paceUnitSelect.appendChild(
        new Option(TranslationManager.getOptionLabel('paceUnit', 'mile'), 'mile')
      );
      paceUnitSelect.value = state.paceUnit;
    }

    if (treadmillUnitSelect) {
      treadmillUnitSelect.innerHTML = '';
      treadmillUnitSelect.appendChild(
        new Option(TranslationManager.getOptionLabel('treadmillUnit', 'km'), 'km')
      );
      treadmillUnitSelect.appendChild(
        new Option(TranslationManager.getOptionLabel('treadmillUnit', 'mile'), 'mile')
      );
      treadmillUnitSelect.value = state.treadmillUnit;
    }

    if (splitModeSelect) {
      splitModeSelect.innerHTML = '';
      splitModeSelect.appendChild(new Option(t.tab_track || 'Track', 'track'));
      splitModeSelect.appendChild(new Option(t.tab_road || 'Road', 'road'));
      splitModeSelect.value = state.splitMode;
    }

    if (venueSelect) {
      venueSelect.innerHTML = '';
      Object.values(VENUES).forEach((venue) => {
        venueSelect.appendChild(new Option(venue.name, venue.id));
      });
      venueSelect.value = state.venue;
    }
  }

  static getPlanLabel(distanceMeters: number): string {
    if (distanceMeters >= FULL_MARATHON_METERS) return TranslationManager.get('plan_full');
    if (distanceMeters >= HALF_MARATHON_METERS) return TranslationManager.get('plan_half');
    return TranslationManager.get('plan_10k');
  }
}

export default TrainingController;
