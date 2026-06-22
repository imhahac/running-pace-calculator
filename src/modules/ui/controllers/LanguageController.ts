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

export class LanguageController {
  static toggleLanguage(): void {
    TranslationManager.toggleLanguage();
    this.applyLanguage();
  }

  static applyLanguage(): void {
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
  }
}

export default LanguageController;
