/**
 * CalcController
 * The calculation pipeline: input handling, the core calculate() call,
 * derived-field/display updates, splits, zones, road splits, finish-time
 * validation and the saved-input bootstrap.
 */

import { getDOMCache, getInputIdForMode } from '../../../constants/domElements.js';
import {
  CONVERSION_FACTORS,
  HALF_MARATHON_METERS,
  FULL_MARATHON_METERS
} from '../../../constants/index.js';
import StateManager from '../../state/StateManager.js';
import StorageManager from '../../state/StorageManager.js';
import Calculator from '../../core/Calculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import Converter from '../../core/Converter.js';
import TranslationManager from '../../state/TranslationManager.js';
import AnalyticsManager from '../AnalyticsManager.js';
import { zoneBar } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import InputStore from './InputStore.js';
import ModeController from './ModeController.js';
import TrainingController from './TrainingController.js';
import TriathlonController from './TriathlonController.js';
import RaceController from './RaceController.js';

export class CalcController {
  private static analyticsDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly SHORT_TIME_REGEX = /^\d{1,2}:\d{1,2}$/;
  private static readonly LONG_TIME_REGEX = /^\d{1,2}:\d{1,2}:\d{1,2}$/;

  private static get dom() {
    return getDOMCache();
  }

  /** Handle input change event. */
  static onInput(inputId: string): void {
    const inputMode = this.getModeByInputId(inputId);
    if (inputMode && inputMode !== StateManager.getMode()) {
      ModeController.setMode(inputMode);
    }

    InputStore.set(inputId, InputStore.getInputValue(inputId));
    this.calculate(inputId);
  }

  /**
   * Finish-time input handler – only triggers calculation when the entered
   * value is a complete, parseable time (avoids garbage from partial input).
   */
  static onFinishTimeInput(): void {
    const value = this.dom.inputs.finishTime?.value ?? '';
    const validation = this.validateFinishTime(value);

    if (!value.trim()) {
      this.updateFinishTimeFeedback();
      return;
    }

    if (!validation.isValid) {
      this.updateFinishTimeFeedback(validation.messageKey, true);
      return;
    }

    this.updateFinishTimeFeedback();
    if (value.includes(':') && TimeFormatter.parse(value) > 0) {
      this.onInput('finish_time_input');
    }
  }

  /** Finish-time input commit (blur / Enter / Tab). */
  static onFinishTimeChange(): void {
    const value = this.dom.inputs.finishTime?.value ?? '';
    const validation = this.validateFinishTime(value);

    if (!value.trim()) {
      this.updateFinishTimeFeedback();
      return;
    }

    if (!validation.isValid) {
      this.updateFinishTimeFeedback(validation.messageKey, true);
      return;
    }

    this.updateFinishTimeFeedback();
    AnalyticsManager.trackFinishTimeValidation(
      true,
      validation.expectedLongFormat ? 'h:mm:ss' : 'm:ss'
    );
    this.onInput('finish_time_input');
  }

  static getModeByInputId(inputId: string): string {
    if (inputId === 'pace_input' || inputId === 'pace_input2') return 'pace';
    if (inputId === 'track_input') return 'track';
    if (inputId === 'treadmill_input') return 'treadmill';
    if (inputId === 'finish_time_input') return 'finish_time';
    return StateManager.getMode();
  }

  /** Main calculation function. */
  static calculate(sourceId: string): void {
    const state = StateManager.getState();

    const paceMin = parseFloat(this.dom.inputs.paceMin?.value || '0') || 0;
    const paceSec = parseFloat(this.dom.inputs.paceSec?.value || '0') || 0;
    const trackSec = parseFloat(this.dom.inputs.track?.value || '0') || 0;
    const treadmillVal = parseFloat(this.dom.inputs.treadmill?.value || '0') || 0;
    const finishTimeVal = this.dom.inputs.finishTime?.value || '';

    const secondsPerLap = Calculator.calculateSecondsPerLap(
      state.mode,
      state,
      paceMin,
      paceSec,
      trackSec,
      treadmillVal,
      finishTimeVal
    );

    if (secondsPerLap <= 0) {
      AnalyticsManager.trackCalculationRejected(
        sourceId,
        state.mode,
        'non-positive-seconds-per-lap'
      );
      return;
    }

    this.updateDisplay(secondsPerLap, sourceId);

    if (this.analyticsDebounceTimer) {
      clearTimeout(this.analyticsDebounceTimer);
    }
    this.analyticsDebounceTimer = setTimeout(() => {
      AnalyticsManager.trackCalculationSuccess(sourceId, state.mode);
    }, 1500);
  }

  /** Update all derived displays from the computed secondsPerLap. */
  private static updateDisplay(secondsPerLap: number, sourceId: string): void {
    const state = StateManager.getState();

    if (sourceId !== 'track_input' && this.dom.inputs.track) {
      this.dom.inputs.track.value = Calculator.round(secondsPerLap, 2).toString();
      InputStore.set('track_input', this.dom.inputs.track.value);
    }

    if (sourceId !== 'pace_input' && sourceId !== 'pace_input2') {
      const paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
      let finalPaceSeconds = paceSecondsPerKm;

      if (state.paceUnit === 'mile') {
        finalPaceSeconds = Converter.paceKmToMile(paceSecondsPerKm);
      }

      const formatted = TimeFormatter.format(finalPaceSeconds);
      const parts = formatted.split(':');

      let m = parts[0];
      let s = parts[1];

      if (parts.length === 3) {
        const hours = parseInt(parts[0]);
        const mins = parseInt(parts[1]);
        m = (hours * 60 + mins).toString();
        s = parts[2];
      }

      if (this.dom.inputs.paceMin) {
        this.dom.inputs.paceMin.value = m;
        InputStore.set('pace_input', m);
      }
      if (this.dom.inputs.paceSec) {
        this.dom.inputs.paceSec.value = s;
        InputStore.set('pace_input2', s);
      }
    }

    if (sourceId !== 'treadmill_input') {
      const kph = (state.lane * 3.6) / secondsPerLap;
      let val = kph;
      if (state.treadmillUnit === 'mile') {
        val = kph * CONVERSION_FACTORS.km_to_mile;
      }
      if (this.dom.inputs.treadmill) {
        this.dom.inputs.treadmill.value = Calculator.round(val, 2).toString();
        InputStore.set('treadmill_input', this.dom.inputs.treadmill.value);
      }
    }

    if (sourceId !== 'finish_time_input') {
      const totalTime = state.distance * (secondsPerLap / state.lane);
      if (this.dom.inputs.finishTime) {
        this.dom.inputs.finishTime.value = TimeFormatter.format(totalTime);
        InputStore.set('finish_time_input', this.dom.inputs.finishTime.value);
      }
    }

    this.updateSplits(secondsPerLap);

    const paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
    InputStore.setLastPace(paceSecondsPerKm);
    this.updateZones(paceSecondsPerKm);
    this.refreshTrainingCycle();
    RaceController.updateRaceInfoUI();

    InputStore.snapshot();
  }

  private static updateSplits(secondsPerLap: number): void {
    const state = StateManager.getState();
    const splits = Calculator.calculateSplits(secondsPerLap, state.lane);
    const s = this.dom.displays.splits;

    if (s.m100) s.m100.value = splits.m100;
    if (s.m200) s.m200.value = splits.m200;
    if (s.m300) s.m300.value = splits.m300;
    if (s.m400) s.m400.value = splits.m400;
    if (s.m800) s.m800.value = splits.m800;
    if (s.m1200) s.m1200.value = splits.m1200;
    if (s.m1600) s.m1600.value = splits.m1600;
    if (s.m2000) s.m2000.value = splits.m2000;

    if (s.inc200) s.inc200.value = splits.inc200;
    if (s.inc300) s.inc300.value = splits.inc300;
    if (s.inc400) s.inc400.value = splits.inc400;

    if (s.lapsText.two) s.lapsText.two.innerHTML = `&emsp;${state.lane * 2}`;
    if (s.lapsText.three) s.lapsText.three.innerHTML = `${state.lane * 3}`;
    if (s.lapsText.four) s.lapsText.four.innerHTML = `${state.lane * 4}`;
    if (s.lapsText.five) s.lapsText.five.innerHTML = `${state.lane * 5}`;

    if (StateManager.getSplitMode() === 'road') {
      this.updateRoadSplits(secondsPerLap);
    }
  }

  /** Re-render the training-pace zones (used on language change). */
  static refreshZones(): void {
    this.updateZones(InputStore.getLastPace());
  }

  private static updateZones(paceSecondsPerKm: number): void {
    if (!paceSecondsPerKm || paceSecondsPerKm <= 0) {
      renderInsight('zones', { ok: false });
      return;
    }

    const ref = paceSecondsPerKm;
    const z = this.dom.displays.zones;
    const fmt = (s: number): string => TimeFormatter.format(s);
    const range = (lo: number, hi: number): string => `${fmt(lo)} - ${fmt(hi)}`;

    if (z.e) z.e.textContent = range(ref + 60, ref + 90);
    if (z.m) z.m.textContent = range(ref + 25, ref + 45);
    if (z.t) z.t.textContent = range(ref + 10, ref + 20);
    if (z.i) z.i.textContent = range(ref - 10, ref);
    if (z.r) z.r.textContent = range(ref - 20, ref - 10);

    const t = (k: string): string => TranslationManager.get(k);
    renderInsight('zones', {
      ok: true,
      chartHtml: zoneBar([
        { label: 'E', value: `${fmt(ref + 60)}+`, caption: t('zone_easy_desc') },
        { label: 'M', value: fmt(ref + 35), caption: t('zone_marathon_desc') },
        { label: 'T', value: fmt(ref + 15), caption: t('zone_threshold_desc') },
        { label: 'I', value: fmt(ref - 5), caption: t('zone_interval_desc') },
        { label: 'R', value: fmt(ref - 15), caption: t('zone_repetition_desc') }
      ]),
      readoutText: t('zones_readout')
    });
  }

  private static updateRoadSplits(secondsPerLap: number): void {
    const state = StateManager.getState();
    const roadContainer = document.getElementById('road-detail');
    if (!roadContainer) return;

    roadContainer.innerHTML = '';
    const t = TranslationManager.getDict();

    const splits = Calculator.generateRoadSplits(secondsPerLap, state.lane);

    splits.forEach((split) => {
      const row = document.createElement('div');
      row.className = 'road-row';

      let isWater = true;
      if (
        Math.abs(split.distance - HALF_MARATHON_METERS) < 1 ||
        Math.abs(split.distance - FULL_MARATHON_METERS) < 1
      ) {
        isWater = false;
      }

      const waterHtml = isWater ? `<span class="water-icon">${t.label_water || '💧'}</span>` : '';

      row.innerHTML = `
        <div>${waterHtml}<span class="road-dist">${split.label}</span></div>
        <div class="road-time">${split.time}</div>
      `;

      if (
        split.distance % 5000 === 0 ||
        Math.abs(split.distance - FULL_MARATHON_METERS) < 1 ||
        Math.abs(split.distance - HALF_MARATHON_METERS) < 1
      ) {
        row.style.borderLeft = '3px solid var(--highlight)';
        row.style.background = 'var(--option-bg)';
      }

      roadContainer.appendChild(row);
    });
  }

  /** Refresh the training-cycle view (guarded by a valid computed pace). */
  static refreshTrainingCycle(): void {
    const lastPace = InputStore.getLastPace();
    if (lastPace > 0) {
      TrainingController.refreshTrainingCycleUI(lastPace);
      RaceController.updateRaceInfoUI();
    }
  }

  /** Validate finish time string according to selected race distance. */
  static validateFinishTime(value: string): {
    isValid: boolean;
    expectedLongFormat: boolean;
    messageKey: string;
  } {
    const trimmed = value.trim();
    const expectedLongFormat = StateManager.getDistance() >= HALF_MARATHON_METERS;

    if (!trimmed.includes(':') || TimeFormatter.parse(trimmed) <= 0) {
      return { isValid: false, expectedLongFormat, messageKey: 'finish_error_invalid' };
    }

    if (expectedLongFormat && !this.LONG_TIME_REGEX.test(trimmed)) {
      return { isValid: false, expectedLongFormat, messageKey: 'finish_error_expected_long' };
    }

    if (!expectedLongFormat && !this.SHORT_TIME_REGEX.test(trimmed)) {
      return { isValid: false, expectedLongFormat, messageKey: 'finish_error_expected_short' };
    }

    return { isValid: true, expectedLongFormat, messageKey: '' };
  }

  /** Show finish-time hint or validation message in a unified feedback area. */
  static updateFinishTimeFeedback(messageKey: string = '', isError: boolean = false): void {
    const feedback = document.getElementById('finish-time-feedback');
    if (!feedback) return;

    const t = TranslationManager.getDict();
    const expectedLongFormat = StateManager.getDistance() >= HALF_MARATHON_METERS;
    const hint = expectedLongFormat
      ? t.finish_hint_long || '半馬/全馬建議格式 h:mm:ss，例如 3:30:00'
      : t.finish_hint_short || '短距離建議格式 m:ss，例如 20:00';

    const text = messageKey
      ? t[messageKey] || t.finish_error_invalid || '時間格式不正確，請使用 m:ss 或 h:mm:ss'
      : hint;

    feedback.textContent = text;
    feedback.classList.toggle('error', isError);
  }

  /** Load saved inputs from localStorage and trigger the initial calculation. */
  static loadSavedInputs(): void {
    const saved = StorageManager.loadState();
    if (!saved || !saved.inputs) return;

    const inputs = saved.inputs;
    if (this.dom.inputs.paceMin && inputs['pace_input'])
      this.dom.inputs.paceMin.value = inputs['pace_input'];
    if (this.dom.inputs.paceSec && inputs['pace_input2'])
      this.dom.inputs.paceSec.value = inputs['pace_input2'];
    if (this.dom.inputs.track && inputs['track_input'])
      this.dom.inputs.track.value = inputs['track_input'];
    if (this.dom.inputs.treadmill && inputs['treadmill_input'])
      this.dom.inputs.treadmill.value = inputs['treadmill_input'];
    if (this.dom.inputs.finishTime && inputs['finish_time_input'])
      this.dom.inputs.finishTime.value = inputs['finish_time_input'];

    this.updateFinishTimeFeedback();

    const triInputs = StateManager.getTriInputs();
    if (triInputs) {
      const triTotalInput = document.getElementById('tri-total-input') as HTMLInputElement;
      const triSwimInput = document.getElementById('tri-swim-input') as HTMLInputElement;
      const triT1Input = document.getElementById('tri-t1-input') as HTMLInputElement;
      const triBikeInput = document.getElementById('tri-bike-input') as HTMLInputElement;
      const triT2Input = document.getElementById('tri-t2-input') as HTMLInputElement;
      const triRunInput = document.getElementById('tri-run-input') as HTMLInputElement;
      if (triTotalInput) triTotalInput.value = triInputs.totalTarget || '';
      if (triSwimInput) triSwimInput.value = triInputs.swim || '';
      if (triT1Input) triT1Input.value = triInputs.t1 || '';
      if (triBikeInput) triBikeInput.value = triInputs.bike || '';
      if (triT2Input) triT2Input.value = triInputs.t2 || '';
      if (triRunInput) triRunInput.value = triInputs.run || '';
      TriathlonController.calculateTriathlon(false);
    }

    const mode = StateManager.getMode();
    const sourceInput = getInputIdForMode(mode);
    if (InputStore.getInputValue(sourceInput)) {
      this.calculate(sourceInput);
    }
    InputStore.snapshot();
  }
}

export default CalcController;
