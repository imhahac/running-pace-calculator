/**
 * LanguageController
 * Applies / toggles the UI language and re-renders the language-dependent
 * parts of the page.
 */

import TranslationManager from '../../state/TranslationManager.js';
import ModeController from './ModeController.js';
import CalcController from './CalcController.js';
import TrainingController from './TrainingController.js';
import RaceController from './RaceController.js';
import HeartRateController from './HeartRateController.js';
import IntervalController from './IntervalController.js';
import RacePlanController from './RacePlanController.js';
import MethodsController from './MethodsController.js';
import CadenceController from './CadenceController.js';
import StridesController from './StridesController.js';
import AcwrController from './AcwrController.js';
import EnvironmentalController from './EnvironmentalController.js';
import FuelingController from './FuelingController.js';
import SweatRateController from './SweatRateController.js';
import GlycogenController from './GlycogenController.js';
import CoolingController from './CoolingController.js';
import RecoveryController from './RecoveryController.js';
import TaperController from './TaperController.js';
import RunningEconomyController from './RunningEconomyController.js';
import HrvController from './HrvController.js';
import MenstrualController from './MenstrualController.js';
import AltitudeController from './AltitudeController.js';
import GapController from './GapController.js';

/**
 * Controllers that build language-dependent content dynamically (innerHTML /
 * badge text set in JS, not via data-i18n). They must recompute on a language
 * switch so already-rendered output is re-translated.
 */
const DYNAMIC_VIEWS: { calculate(): void }[] = [
  HeartRateController,
  IntervalController,
  RacePlanController,
  MethodsController,
  CadenceController,
  StridesController,
  AcwrController,
  EnvironmentalController,
  FuelingController,
  SweatRateController,
  GlycogenController,
  CoolingController,
  RecoveryController,
  TaperController,
  RunningEconomyController,
  HrvController,
  MenstrualController,
  AltitudeController
];

export class LanguageController {
  static toggleLanguage(): void {
    TranslationManager.toggleLanguage();
    this.applyLanguage();
  }

  /**
   * @param refreshDynamic re-translate JS-rendered tool output. Skipped on the
   * initial load (each controller computes itself on init, so this would just
   * be a wasted pass); enabled for real language changes (toggle / settings /
   * cloud-sync pull).
   */
  static applyLanguage(refreshDynamic = true): void {
    const lang = TranslationManager.getCurrentLanguage();
    document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
    TranslationManager.updateDOMTranslations();
    ModeController.populateVenues();

    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.textContent = lang === 'zh' ? '中/EN' : 'EN/中';
    }

    document.title = lang === 'zh' ? 'RunningPaceNote 配速計算機' : 'RunningPaceNote Calculator';
    CalcController.updateFinishTimeFeedback();

    RaceController.fetchAndPopulateRaces();
    TrainingController.populateSettingsPanel();
    CalcController.refreshTrainingCycle();

    if (refreshDynamic) {
      // Re-translate dynamically rendered science/environment tool output.
      DYNAMIC_VIEWS.forEach((view) => view.calculate());
      GapController.render();
    }
  }
}

export default LanguageController;
