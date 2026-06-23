/**
 * UIController
 * Thin coordinator: caches DOM, restores state, and wires event listeners to
 * the specialised controllers. All feature logic lives in those controllers.
 */

import { getDOMCache } from '../../constants/domElements.js';
import StateManager from '../state/StateManager.js';
import TranslationManager from '../state/TranslationManager.js';
import FormPersistence, { TOOL_INPUT_IDS } from '../state/FormPersistence.js';
import RaceDataManager from './RaceDataManager.js';
import BackendClient from '../state/BackendClient.js';
import TrainingCycleManager from './TrainingCycleManager.js';
import ThemeController from './ThemeController.js';
import RaceController from './controllers/RaceController.js';
import ShareController from './controllers/ShareController.js';
import TrainingController from './controllers/TrainingController.js';
import SettingsController from './controllers/SettingsController.js';
import TriathlonController from './controllers/TriathlonController.js';
import InputStore from './controllers/InputStore.js';
import CalcController from './controllers/CalcController.js';
import ModeController from './controllers/ModeController.js';
import SplitViewController from './controllers/SplitViewController.js';
import PredictionController from './controllers/PredictionController.js';
import LanguageController from './controllers/LanguageController.js';
import ShareLoadController from './controllers/ShareLoadController.js';
import VdotController from './controllers/VdotController.js';
import HeartRateController from './controllers/HeartRateController.js';
import IntervalController from './controllers/IntervalController.js';
import RacePlanController from './controllers/RacePlanController.js';
import MethodsController from './controllers/MethodsController.js';
import EnvironmentalController from './controllers/EnvironmentalController.js';
import AcwrController from './controllers/AcwrController.js';
import CadenceController from './controllers/CadenceController.js';
import StridesController from './controllers/StridesController.js';
import FuelingController from './controllers/FuelingController.js';
import SweatRateController from './controllers/SweatRateController.js';
import GlycogenController from './controllers/GlycogenController.js';
import CoolingController from './controllers/CoolingController.js';
import RecoveryController from './controllers/RecoveryController.js';
import TaperController from './controllers/TaperController.js';
import GapController from './controllers/GapController.js';
import RunningEconomyController from './controllers/RunningEconomyController.js';
import HrvController from './controllers/HrvController.js';
import MenstrualController from './controllers/MenstrualController.js';
import AltitudeController from './controllers/AltitudeController.js';
import SyncController from './controllers/SyncController.js';
import VersionController from './controllers/VersionController.js';
import type { TMode } from '../../types/index';

export class UIController {
  private static dom = getDOMCache();

  private static bindModeInput(input: HTMLInputElement | null, mode: TMode): void {
    if (!input) return;
    input.addEventListener('focus', () => ModeController.setMode(mode));
    input.addEventListener('click', () => ModeController.setMode(mode));
    input.addEventListener('focus', () => input.select());
  }

  private static bindSelectAllOnFocus(input: HTMLInputElement | null): void {
    if (!input) return;
    input.addEventListener('focus', () => input.select());
  }

  /** Initialize UI controller and restore saved state. */
  static initialize(): void {
    this.dom = getDOMCache();
    CalcController.loadSavedInputs();
    ThemeController.initialize();
    LanguageController.applyLanguage(false); // dynamic tools compute on their own init below

    if (this.dom.distanceSelect) {
      this.dom.distanceSelect.value = StateManager.getDistance().toString();
    }

    const trackDistanceSelect = document.getElementById(
      'track_distance_select'
    ) as HTMLSelectElement | null;
    if (trackDistanceSelect) trackDistanceSelect.value = StateManager.getTrackDistance().toString();

    const trainingPlanType = document.getElementById(
      'training-plan-type'
    ) as HTMLSelectElement | null;
    if (trainingPlanType) trainingPlanType.value = StateManager.getPlanType();

    CalcController.updateFinishTimeFeedback();
    SplitViewController.syncSplitModeUI(StateManager.getSplitMode());
    ModeController.updateModeCardAccessibility();
    TrainingController.populateSettingsPanel();
    TrainingController.applySchoolPreset();
    // Restore persisted tool inputs BEFORE any controller computes, so every
    // tool's first render reflects saved values (not just the later ones).
    FormPersistence.restore(TOOL_INPUT_IDS);
    VdotController.initialize();
    HeartRateController.initialize();
    IntervalController.initialize();
    RacePlanController.initialize();
    MethodsController.initialize();
    CadenceController.initialize();
    StridesController.initialize();
    AcwrController.initialize();
    EnvironmentalController.initialize();
    FuelingController.initialize();
    SweatRateController.initialize();
    GlycogenController.initialize();
    CoolingController.initialize();
    RecoveryController.initialize();
    TaperController.initialize();
    GapController.initialize();
    RunningEconomyController.initialize();
    HrvController.initialize();
    MenstrualController.initialize();
    AltitudeController.initialize();
    FormPersistence.bindAutosave(TOOL_INPUT_IDS);
    ShareLoadController.applySharedPayloadFromURL();

    // Populate the URL settings fields from state.
    const gasField = document.getElementById('settings-gas-url') as HTMLInputElement | null;
    if (gasField) gasField.value = StateManager.getGasApiUrl();
    const backendField = document.getElementById('settings-backend-url') as HTMLInputElement | null;
    if (backendField) backendField.value = StateManager.getBackendUrl();

    // Races come from the Worker (/api/races) when a backend URL is set,
    // otherwise fall back to the legacy GAS URL.
    RaceDataManager.setApiUrl(BackendClient.racesUrl() || StateManager.getGasApiUrl());
    RaceController.fetchAndPopulateRaces();

    void SyncController.initialize();
    VersionController.initialize();
  }

  /** Bind all event listeners. */
  static bindEvents(): void {
    if (!this.dom) return;

    // Mode selection radios
    this.dom.radios?.forEach((radio) => {
      radio.addEventListener('change', (e: Event) => {
        ModeController.setMode((e.target as HTMLInputElement).value);
      });
    });

    // Main input fields
    if (this.dom.inputs.paceMin) {
      this.dom.inputs.paceMin.addEventListener('input', () => CalcController.onInput('pace_input'));
    }
    if (this.dom.inputs.paceSec) {
      this.dom.inputs.paceSec.addEventListener('input', () =>
        CalcController.onInput('pace_input2')
      );
    }
    if (this.dom.inputs.track) {
      this.dom.inputs.track.addEventListener('input', () => CalcController.onInput('track_input'));
    }
    if (this.dom.inputs.treadmill) {
      this.dom.inputs.treadmill.addEventListener('input', () =>
        CalcController.onInput('treadmill_input')
      );
    }
    if (this.dom.inputs.finishTime) {
      this.dom.inputs.finishTime.addEventListener('input', () =>
        CalcController.onFinishTimeInput()
      );
      this.dom.inputs.finishTime.addEventListener('change', () =>
        CalcController.onFinishTimeChange()
      );
    }

    // Switch mode when user focuses/clicks an input field
    this.bindModeInput(this.dom.inputs.paceMin, 'pace');
    this.bindModeInput(this.dom.inputs.paceSec, 'pace');
    this.bindModeInput(this.dom.inputs.track, 'track');
    this.bindModeInput(this.dom.inputs.treadmill, 'treadmill');
    this.bindModeInput(this.dom.inputs.finishTime, 'finish_time');

    this.bindSelectAllOnFocus(this.dom.inputs.paceMin);
    this.bindSelectAllOnFocus(this.dom.inputs.paceSec);
    this.bindSelectAllOnFocus(this.dom.inputs.track);
    this.bindSelectAllOnFocus(this.dom.inputs.treadmill);
    this.bindSelectAllOnFocus(this.dom.inputs.finishTime);

    // Prevent negative numbers and scientific notation chars in number inputs
    [
      this.dom.inputs.paceMin,
      this.dom.inputs.paceSec,
      this.dom.inputs.track,
      this.dom.inputs.treadmill
    ].forEach((input) => {
      if (!input) return;
      input.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === '-' || keyEvent.key === 'e' || keyEvent.key === 'E') {
          keyEvent.preventDefault();
        }
      });
    });

    // Mode icons: keyboard activation
    document
      .querySelectorAll('#pace_icon, #track_icon, #treadmill_icon, #finish_time_icon')
      .forEach((el) => {
        const mode = (el.id || '').replace('_icon', '');
        if (!mode) return;
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.addEventListener('keydown', (e: Event) => {
          const keyEvent = e as KeyboardEvent;
          if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
            keyEvent.preventDefault();
            ModeController.setMode(mode);
          }
        });
      });

    // Splits / info container toggles
    if (this.dom.buttons.slide) {
      this.dom.buttons.slide.addEventListener('click', () =>
        SplitViewController.toggleSplitsContainer()
      );
    }
    if (this.dom.buttons.info) {
      this.dom.buttons.info.addEventListener('click', () =>
        SplitViewController.toggleInfoContainer()
      );
    }

    // Unit toggles
    if (this.dom.buttons.mile) {
      this.dom.buttons.mile.addEventListener('click', () => ModeController.togglePaceUnit());
    }
    if (this.dom.buttons.perHour) {
      this.dom.buttons.perHour.addEventListener('click', () =>
        ModeController.toggleTreadmillUnit()
      );
    }

    // Venue selector (lane is always the innermost lane of the venue)
    if (this.dom.venueSelect) {
      this.dom.venueSelect.addEventListener('change', () => ModeController.onVenueChange());
    }

    // Finish distance chips
    const finishChips = document.querySelectorAll('#finish-distance-chips .chip-btn');
    const finishDropdown = document.getElementById('dropdown') as HTMLInputElement | null;
    if (finishChips.length > 0 && finishDropdown) {
      finishChips.forEach((chip) => {
        chip.addEventListener('click', () => {
          finishChips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          finishDropdown.value = (chip as HTMLElement).dataset.value || '42195';
          StateManager.setDistance(parseFloat(finishDropdown.value));
          CalcController.onInput('finish_time_input');
        });
      });
      const initialDist = StateManager.getDistance().toString();
      finishChips.forEach((c) => {
        if ((c as HTMLElement).dataset.value === initialDist) {
          c.classList.add('active');
          c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }

    if (this.dom.distanceSelect) {
      this.dom.distanceSelect.addEventListener('change', () => ModeController.onDistanceChange());
    }

    // Theme + language toggles
    if (this.dom.buttons.theme) {
      this.dom.buttons.theme.addEventListener('click', () => ThemeController.toggleTheme());
    }
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => LanguageController.toggleLanguage());
    }

    // Copy / share / export buttons
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', () => this.copyResults());
    const shareBtn = document.getElementById('share-link-btn');
    if (shareBtn) shareBtn.addEventListener('click', () => ShareController.copyShareLink());
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', () => ShareController.exportPDF());
    const exportImageBtn = document.getElementById('export-image-btn');
    if (exportImageBtn)
      exportImageBtn.addEventListener('click', () => ShareController.exportImage());
    const openReportBtn = document.getElementById('open-report-btn');
    if (openReportBtn)
      openReportBtn.addEventListener('click', () => ShareController.openTrainingReportPage());

    // Collapsible "詳解" (one delegated listener for every .detail-toggle). Each
    // toggle controls the .tool-detail referenced by its aria-controls id.
    document.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('.detail-toggle');
      if (!btn) return;
      const panel = document.getElementById(btn.getAttribute('aria-controls') || '');
      if (!panel) return;
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Triathlon bindings
    TriathlonController.initBindings();

    // Split mode (track vs road)
    const toggleTrack = document.getElementById('toggle-track');
    const toggleRoad = document.getElementById('toggle-road');
    if (toggleTrack)
      toggleTrack.addEventListener('click', () => SplitViewController.switchSplitMode('track'));
    if (toggleRoad)
      toggleRoad.addEventListener('click', () => SplitViewController.switchSplitMode('road'));

    // Top-level tab switching
    document.querySelectorAll('.tab-item').forEach((tab) => {
      const activate = () => {
        const targetId = (tab as HTMLElement).dataset.tab;
        if (targetId) SplitViewController.switchTopLevelTab(targetId);
      };
      tab.addEventListener('click', activate);
      tab.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
          keyEvent.preventDefault();
          activate();
        }
      });
    });
    SplitViewController.switchTopLevelTab(StateManager.getActiveTab());

    // Settings panel
    const settingsApply = document.getElementById('settings-apply');
    if (settingsApply) {
      settingsApply.addEventListener('click', () => SettingsController.applySettingsFromPanel());
    }

    // Training cycle controls
    const trainingDate = document.getElementById('training-target-date') as HTMLInputElement | null;
    if (trainingDate) {
      trainingDate.addEventListener('change', () => CalcController.refreshTrainingCycle());
    }
    const trainingPlanDistance = document.getElementById(
      'training-plan-distance'
    ) as HTMLSelectElement | null;
    if (trainingPlanDistance) {
      trainingPlanDistance.addEventListener('change', () => CalcController.refreshTrainingCycle());
    }
    const trainingPlanType = document.getElementById(
      'training-plan-type'
    ) as HTMLSelectElement | null;
    if (trainingPlanType) {
      trainingPlanType.addEventListener('change', () => {
        StateManager.setPlanType(trainingPlanType.value as 'running' | 'triathlon');
        CalcController.refreshTrainingCycle();
      });
    }

    // Plan customization (difficulty preset + weeks / start & peak volume)
    const trainingDifficulty = document.getElementById('training-difficulty');
    if (trainingDifficulty) {
      trainingDifficulty.addEventListener('change', () => {
        TrainingController.applyDifficultyPreset();
        CalcController.refreshTrainingCycle();
      });
    }
    const trainingSchool = document.getElementById('training-school');
    if (trainingSchool) {
      trainingSchool.addEventListener('change', () => {
        TrainingController.applySchoolPreset();
        CalcController.refreshTrainingCycle();
      });
    }
    const exportCsvBtn = document.getElementById('training-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => TrainingCycleManager.exportCsv());
    }
    ['training-weeks', 'training-start-vol', 'training-peak-vol'].forEach((id) => {
      document
        .getElementById(id)
        ?.addEventListener('input', () => CalcController.refreshTrainingCycle());
    });

    // Track distance segmented control
    const trackSegmentBtns = document.querySelectorAll('#track-distance-segmented .segment-btn');
    const trackDistanceSelect = document.getElementById(
      'track_distance_select'
    ) as HTMLInputElement | null;
    if (trackSegmentBtns.length > 0 && trackDistanceSelect) {
      trackSegmentBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          trackSegmentBtns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          trackDistanceSelect.value = (btn as HTMLElement).dataset.value || '400';
          StateManager.setTrackDistance(parseInt(trackDistanceSelect.value, 10));
          CalcController.onInput('track_input');
        });
      });
      const initialTrackDist = StateManager.getTrackDistance().toString();
      trackSegmentBtns.forEach((btn) => {
        if ((btn as HTMLElement).dataset.value === initialTrackDist) {
          btn.classList.add('active');
        }
      });
    }

    // Prediction inputs
    const predDistSelect = document.getElementById('pred-dist-select');
    const predTimeInput = document.getElementById('pred-time-input');
    if (predDistSelect)
      predDistSelect.addEventListener('change', () => PredictionController.calculatePrediction());
    if (predTimeInput)
      predTimeInput.addEventListener('input', () => PredictionController.calculatePrediction());

    // Race selection
    const raceList = document.getElementById('race-list') as HTMLSelectElement | null;
    if (raceList) {
      raceList.addEventListener('change', () => {
        RaceController.onRaceSelected();
        CalcController.refreshTrainingCycle();
      });
    }

    // Auto-save on before unload
    window.addEventListener('beforeunload', () => {
      InputStore.snapshot();
      StateManager.saveToStorage(InputStore.getValues());
    });
  }

  /** Copy a textual summary of the results to the clipboard. */
  private static copyResults(): void {
    const t = TranslationManager.getDict();
    const state = StateManager.getState();

    const paceText = `${this.dom.inputs.paceMin?.value}:${this.dom.inputs.paceSec?.value}/${state.paceUnit}`;
    const trackText = `${this.dom.inputs.track?.value}s (${state.lane}m)`;
    const finishText = this.dom.inputs.finishTime?.value;

    const textToCopy = `${t.copy_header || '🏃 RunningPaceNote 計算結果:'}
--------------------
${t.copy_pace || '⏱️ 配速:'} ${paceText}
${t.copy_track || '🔄 田徑場:'} ${trackText}
${t.copy_finish || '🏁 完賽時間:'} ${finishText}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => alert(t.copy_success || '✅ 已複製'))
      .catch(() => alert(t.copy_fail || '複製失敗'));
  }
}

export default UIController;
