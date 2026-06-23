/**
 * ModeController
 * Owns mode selection, unit toggles, venue/lane selection and the
 * placeholder/highlight/accessibility concerns that cluster around "which
 * mode is active and what are its units".
 */

import { getDOMCache, getInputIdForMode } from '../../../constants/domElements.js';
import { VENUES, MODE_PLACEHOLDERS } from '../../../constants/index.js';
import StateManager from '../../state/StateManager.js';
import TranslationManager from '../../state/TranslationManager.js';
import InputStore from './InputStore.js';
import CalcController from './CalcController.js';
import type { TMode } from '../../../types/index';

export class ModeController {
  private static get dom() {
    return getDOMCache();
  }

  /** Set application mode. */
  static setMode(newMode: string): void {
    const validModes: TMode[] = ['pace', 'track', 'treadmill', 'finish_time'];
    if (!validModes.includes(newMode as TMode)) return;
    StateManager.setMode(newMode as TMode);

    const radio = document.querySelector(
      `input[name="type"][value="${newMode}"]`
    ) as HTMLInputElement;
    if (radio) radio.checked = true;

    document.querySelectorAll('.row').forEach((el) => el.classList.remove('selected'));
    const modeIcon = document.getElementById(`${newMode}_icon`);
    if (modeIcon) modeIcon.classList.add('selected');

    this.clearPlaceholders();
    this.setPlaceholders(newMode);
    this.updateModeCardAccessibility();

    if (newMode === 'finish_time') {
      CalcController.updateFinishTimeFeedback();
    }

    const inputId = getInputIdForMode(newMode);
    this.highlightInput(inputId);
  }

  static togglePaceUnit(): void {
    const current = StateManager.getPaceUnit();
    const newUnit = current === 'km' ? 'mile' : 'km';
    StateManager.setPaceUnit(newUnit);

    if (this.dom.buttons.mileSwitchText) {
      this.dom.buttons.mileSwitchText.textContent = newUnit === 'km' ? '(Km)' : '(Mile)';
    }
    if (this.dom.displays.unit) {
      this.dom.displays.unit.textContent = TranslationManager.getUnitLabel('pace', newUnit);
    }

    CalcController.calculate(getInputIdForMode(StateManager.getMode()));
  }

  static toggleTreadmillUnit(): void {
    const current = StateManager.getTreadmillUnit();
    const newUnit = current === 'km' ? 'mile' : 'km';
    StateManager.setTreadmillUnit(newUnit);

    if (this.dom.buttons.perHourSwitchText) {
      this.dom.buttons.perHourSwitchText.textContent = newUnit === 'km' ? '(Km/h)' : '(Mile/h)';
    }
    if (this.dom.displays.unit2) {
      this.dom.displays.unit2.textContent = TranslationManager.getUnitLabel('treadmill', newUnit);
    }

    CalcController.calculate(getInputIdForMode(StateManager.getMode()));
  }

  static onDistanceChange(): void {
    const val = this.dom.distanceSelect?.value;
    if (!val) return;
    const distance = parseFloat(val);
    if (distance > 0) {
      StateManager.setDistance(distance);
      CalcController.updateFinishTimeFeedback();
      const currentInput = getInputIdForMode(StateManager.getMode());
      if (InputStore.getInputValue(currentInput)) {
        CalcController.calculate(currentInput);
      }
    }
  }

  static onVenueChange(): void {
    const venue = this.dom.venueSelect?.value;
    if (venue) {
      StateManager.setVenue(venue);
      this.applyVenueLane();
    }
  }

  static populateVenues(): void {
    if (!this.dom.venueSelect) return;

    this.dom.venueSelect.innerHTML = '';
    const t = TranslationManager.getDict();
    const state = StateManager.getState();

    const venueMap: Record<string, string> = {
      standard_400: t.venue_400 || '台北田徑場 (400m)',
      warmup_300: t.venue_300 || '台北暖身場 (300m)'
    };

    Object.values(VENUES).forEach((venue) => {
      const opt = document.createElement('option');
      opt.value = venue.id;
      opt.textContent = venueMap[venue.id] || venue.name;
      this.dom.venueSelect!.appendChild(opt);
    });

    this.dom.venueSelect.value = state.venue;
    this.applyVenueLane();
  }

  /**
   * Always use the innermost lane (lane 1) of the selected venue — its distance
   * is the full track distance (400m / 300m). The per-lane selector was removed,
   * so the venue switch is the only track variable.
   */
  static applyVenueLane(): void {
    const venue = VENUES[StateManager.getVenue() as keyof typeof VENUES];
    if (!venue) return;

    const laneDist = venue.lanes[0].dist;
    StateManager.setLane(laneDist);

    if (this.dom.displays.laneLength) {
      this.dom.displays.laneLength.textContent = `${laneDist}m`;
    }

    const currentInput = getInputIdForMode(StateManager.getMode());
    if (InputStore.getInputValue(currentInput)) {
      CalcController.calculate(currentInput);
    }
  }

  static highlightInput(inputId: string): void {
    Object.values(this.dom.inputs).forEach((el) => {
      if (el) el.style.color = '';
    });

    const el = document.getElementById(inputId);
    if (el) el.style.color = 'var(--highlight)';

    if (inputId === 'pace_input' || inputId === 'pace_input2') {
      if (this.dom.inputs.paceMin) this.dom.inputs.paceMin.style.color = 'var(--highlight)';
      if (this.dom.inputs.paceSec) this.dom.inputs.paceSec.style.color = 'var(--highlight)';
    }
  }

  static setPlaceholders(mode: string): void {
    const placeholders = MODE_PLACEHOLDERS[mode];
    if (!placeholders) return;

    if (mode === 'pace' && Array.isArray(placeholders)) {
      if (this.dom.inputs.paceMin) this.dom.inputs.paceMin.placeholder = placeholders[0];
      if (this.dom.inputs.paceSec) this.dom.inputs.paceSec.placeholder = placeholders[1];
      this.highlightInput('pace_input');
    } else if (mode === 'track') {
      if (this.dom.inputs.track) this.dom.inputs.track.placeholder = placeholders.toString();
      this.highlightInput('track_input');
    } else if (mode === 'treadmill') {
      if (this.dom.inputs.treadmill)
        this.dom.inputs.treadmill.placeholder = placeholders.toString();
      this.highlightInput('treadmill_input');
    } else if (mode === 'finish_time') {
      if (this.dom.inputs.finishTime)
        this.dom.inputs.finishTime.placeholder = placeholders.toString();
      this.highlightInput('finish_time_input');
    }
  }

  static clearPlaceholders(): void {
    Object.values(this.dom.inputs).forEach((el) => {
      if (el) el.placeholder = '';
    });
  }

  static updateModeCardAccessibility(): void {
    const currentMode = StateManager.getMode();
    document.querySelectorAll('.row').forEach((el) => {
      const mode = (el.id || '').replace('_icon', '');
      el.setAttribute('aria-pressed', mode === currentMode ? 'true' : 'false');
    });
  }
}

export default ModeController;
