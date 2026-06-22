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

  static populateSettingsPanel(): void {
    const state = StateManager.getState();
    const t = TranslationManager.getAll();

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
    const laneSelect = document.getElementById('settings-lane') as HTMLSelectElement | null;

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
      this.populateSettingsLaneOptions(state.venue);
    }

    if (laneSelect && laneSelect.options.length > 0) {
      laneSelect.value = state.lane.toString();
    }
  }

  static populateSettingsLaneOptions(venueId: string): void {
    const laneSelect = document.getElementById('settings-lane') as HTMLSelectElement | null;
    if (!laneSelect) return;

    const venue = VENUES[venueId as keyof typeof VENUES];
    laneSelect.innerHTML = '';
    if (!venue) return;

    venue.lanes.forEach((lane) => {
      laneSelect.appendChild(new Option(`${lane.label} (${lane.dist}m)`, lane.dist.toString()));
    });
  }

  static getPlanLabel(distanceMeters: number): string {
    if (distanceMeters >= FULL_MARATHON_METERS) return TranslationManager.get('plan_full');
    if (distanceMeters >= HALF_MARATHON_METERS) return TranslationManager.get('plan_half');
    return TranslationManager.get('plan_10k');
  }
}

export default TrainingController;
