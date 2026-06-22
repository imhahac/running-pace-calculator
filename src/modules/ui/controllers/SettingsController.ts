/**
 * SettingsController
 * Reads the settings panel and applies each preference by delegating directly
 * to the owning controller (no callback injection).
 */

import { getDOMCache, getInputIdForMode } from '../../../constants/domElements.js';
import TranslationManager from '../../state/TranslationManager.js';
import StateManager from '../../state/StateManager.js';
import InputStore from './InputStore.js';
import CalcController from './CalcController.js';
import ModeController from './ModeController.js';
import SplitViewController from './SplitViewController.js';
import LanguageController from './LanguageController.js';

export class SettingsController {
  private static get dom() {
    return getDOMCache();
  }

  /** Apply settings from panel and persist them immediately. */
  static applySettingsFromPanel(): void {
    const lang = (document.getElementById('settings-lang') as HTMLSelectElement | null)?.value;
    const paceUnit = (document.getElementById('settings-pace-unit') as HTMLSelectElement | null)
      ?.value;
    const treadmillUnit = (
      document.getElementById('settings-treadmill-unit') as HTMLSelectElement | null
    )?.value;
    const splitMode = (document.getElementById('settings-split-mode') as HTMLSelectElement | null)
      ?.value as 'track' | 'road' | undefined;
    const venue = (document.getElementById('settings-venue') as HTMLSelectElement | null)?.value;

    this.applyLanguage(lang);
    this.applyPaceUnit(paceUnit);
    this.applyTreadmillUnit(treadmillUnit);
    this.applyVenue(venue);
    this.applySplitMode(splitMode);

    InputStore.snapshot();
    StateManager.saveToStorage(InputStore.getValues());

    const currentInput = getInputIdForMode(StateManager.getMode());
    if (InputStore.getInputValue(currentInput)) {
      CalcController.calculate(currentInput);
    }
  }

  static applyLanguage(lang: string | undefined): void {
    if (lang === 'zh' || lang === 'en') {
      StateManager.setLanguage(lang);
      LanguageController.applyLanguage();
    }
  }

  static applyPaceUnit(paceUnit: string | undefined): void {
    if (paceUnit !== 'km' && paceUnit !== 'mile') return;
    StateManager.setPaceUnit(paceUnit);
    if (this.dom.buttons.mileSwitchText) {
      this.dom.buttons.mileSwitchText.textContent = paceUnit === 'km' ? '(Km)' : '(Mile)';
    }
    if (this.dom.displays.unit) {
      this.dom.displays.unit.textContent = TranslationManager.getUnitLabel('pace', paceUnit);
    }
  }

  static applyTreadmillUnit(treadmillUnit: string | undefined): void {
    if (treadmillUnit !== 'km' && treadmillUnit !== 'mile') return;
    StateManager.setTreadmillUnit(treadmillUnit);
    if (this.dom.buttons.perHourSwitchText) {
      this.dom.buttons.perHourSwitchText.textContent =
        treadmillUnit === 'km' ? '(Km/h)' : '(Mile/h)';
    }
    if (this.dom.displays.unit2) {
      this.dom.displays.unit2.textContent = TranslationManager.getUnitLabel(
        'treadmill',
        treadmillUnit
      );
    }
  }

  static applyVenue(venue: string | undefined): void {
    if (!venue) return;
    StateManager.setVenue(venue);
    // Re-populates the venue dropdown and sets the lane to the venue's
    // innermost lane (lane 1) via ModeController.applyVenueLane().
    ModeController.populateVenues();
  }

  static applySplitMode(splitMode: string | undefined): void {
    if (splitMode === 'track' || splitMode === 'road') {
      SplitViewController.switchSplitMode(splitMode);
    }
  }
}

export default SettingsController;
