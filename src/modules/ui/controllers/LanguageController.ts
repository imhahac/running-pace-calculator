/**
 * LanguageController
 * Applies / toggles the UI language and re-renders the language-dependent
 * parts of the page.
 */

import TranslationManager from '../../state/TranslationManager.js';
import ModeController from './ModeController.js';
import CalcController from './CalcController.js';
import VdotController from './VdotController.js';
import TriathlonController from './TriathlonController.js';
import TrainingController from './TrainingController.js';
import RaceController from './RaceController.js';
import AllRacesController from './AllRacesController.js';
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
import FitnessTrendController from './FitnessTrendController.js';
import ReadinessController from './ReadinessController.js';
import GapController from './GapController.js';
import VersionController from './VersionController.js';

/**
 * Controllers that build language-dependent content dynamically (innerHTML /
 * badge text set in JS, not via data-i18n). They must recompute on a language
 * switch so already-rendered output is re-translated.
 */
const DYNAMIC_VIEWS: { calculate(): void }[] = [
  VdotController,
  TriathlonController,
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
  AltitudeController,
  FitnessTrendController,
  ReadinessController,
  AllRacesController,
  VersionController
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
    // CalcController.refreshZones() is called explicitly (not via DYNAMIC_VIEWS)
    // because CalcController.calculate(sourceId) takes an argument and cannot
    // fit the no-arg `{ calculate(): void }` contract.
    CalcController.refreshZones();

    if (refreshDynamic) {
      // Re-translate JS-rendered tool output. GapController.render() is listed
      // separately (its public method is render(), not calculate()).
      DYNAMIC_VIEWS.forEach((view) => view.calculate());
      GapController.render();
    }
  }
}

export default LanguageController;
