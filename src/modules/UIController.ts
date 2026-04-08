/**
 * UIController Module
 * Centralized DOM manipulation and event binding
 */

import { getDOMCache, getInputElementByMode, getInputIdForMode } from '../constants/domElements.js';
import { VENUES, MODE_PLACEHOLDERS, DEFAULT_STATE, CONVERSION_FACTORS, HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../constants/index.js';
import StateManager from './StateManager.js';
import Calculator from './Calculator.js';
import TimeFormatter from './TimeFormatter.js';
import TranslationManager from './TranslationManager.js';
import StorageManager from './StorageManager.js';
import Converter from './Converter.js';
import type { IPaceState, TMode } from '../types/index';

export class UIController {
  private static dom = getDOMCache();
  private static inputValues: Record<string, string> = {};

  /**
   * Initialize UI controller and restore saved state
   */
  static initialize(): void {
    this.dom = getDOMCache();
    this.loadSavedInputs();
    this.applyTheme();
    this.applyLanguage();
  }

  /**
   * Bind all event listeners
   */
  static bindEvents(): void {
    if (!this.dom) return;

    // Mode selection radios
    this.dom.radios?.forEach((radio) => {
      radio.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        this.setMode(target.value);
      });
    });

    // Main input fields
    if (this.dom.inputs.paceMin) {
      this.dom.inputs.paceMin.addEventListener('input', () => this.onInput('pace_input'));
    }
    if (this.dom.inputs.paceSec) {
      this.dom.inputs.paceSec.addEventListener('input', () => this.onInput('pace_input2'));
    }
    if (this.dom.inputs.track) {
      this.dom.inputs.track.addEventListener('input', () => this.onInput('track_input'));
    }
    if (this.dom.inputs.treadmill) {
      this.dom.inputs.treadmill.addEventListener('input', () => this.onInput('treadmill_input'));
    }
    if (this.dom.inputs.finishTime) {
      this.dom.inputs.finishTime.addEventListener('input', () => this.onInput('finish_time_input'));
    }

    // Switch mode when user focuses/clicks an input field
    if (this.dom.inputs.paceMin) {
      this.dom.inputs.paceMin.addEventListener('focus', () => this.setMode('pace'));
      this.dom.inputs.paceMin.addEventListener('click', () => this.setMode('pace'));
    }
    if (this.dom.inputs.paceSec) {
      this.dom.inputs.paceSec.addEventListener('focus', () => this.setMode('pace'));
      this.dom.inputs.paceSec.addEventListener('click', () => this.setMode('pace'));
    }
    if (this.dom.inputs.track) {
      this.dom.inputs.track.addEventListener('focus', () => this.setMode('track'));
      this.dom.inputs.track.addEventListener('click', () => this.setMode('track'));
    }
    if (this.dom.inputs.treadmill) {
      this.dom.inputs.treadmill.addEventListener('focus', () => this.setMode('treadmill'));
      this.dom.inputs.treadmill.addEventListener('click', () => this.setMode('treadmill'));
    }
    if (this.dom.inputs.finishTime) {
      this.dom.inputs.finishTime.addEventListener('focus', () => this.setMode('finish_time'));
      this.dom.inputs.finishTime.addEventListener('click', () => this.setMode('finish_time'));
    }

    // Splits container expand (+) button
    if (this.dom.buttons.slide) {
      this.dom.buttons.slide.addEventListener('click', () => this.toggleSplitsContainer());
    }

    // Info container toggle
    if (this.dom.buttons.info) {
      this.dom.buttons.info.addEventListener('click', () => this.toggleInfoContainer());
    }

    // Unit toggles
    if (this.dom.buttons.mile) {
      this.dom.buttons.mile.addEventListener('click', () => this.togglePaceUnit());
    }
    if (this.dom.buttons.perHour) {
      this.dom.buttons.perHour.addEventListener('click', () => this.toggleTreadmillUnit());
    }

    // Venue and lane selectors
    if (this.dom.venueSelect) {
      this.dom.venueSelect.addEventListener('change', () => this.onVenueChange());
    }
    if (this.dom.laneSelect) {
      this.dom.laneSelect.addEventListener('change', () => this.onLaneChange());
    }

    // Theme toggle
    if (this.dom.buttons.theme) {
      this.dom.buttons.theme.addEventListener('click', () => this.toggleTheme());
    }

    // Language toggle
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
      langToggle.addEventListener('click', () => this.toggleLanguage());
    }

    // Copy button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyResults());
    }

    // Tab switching (track vs road splits)
    const toggleTrack = document.getElementById('toggle-track');
    const toggleRoad = document.getElementById('toggle-road');
    if (toggleTrack) {
      toggleTrack.addEventListener('click', () => this.switchSplitMode('track'));
    }
    if (toggleRoad) {
      toggleRoad.addEventListener('click', () => this.switchSplitMode('road'));
    }

    // Advanced tools toggle
    const toggleTools = document.getElementById('toggle-tools');
    if (toggleTools) {
      toggleTools.addEventListener('click', () => this.toggleAdvancedTools());
    }

    // Prediction inputs
    const predDistSelect = document.getElementById('pred-dist-select');
    const predTimeInput = document.getElementById('pred-time-input');
    if (predDistSelect) {
      predDistSelect.addEventListener('change', () => this.calculatePrediction());
    }
    if (predTimeInput) {
      predTimeInput.addEventListener('input', () => this.calculatePrediction());
    }

    // Auto-save on before unload
    window.addEventListener('beforeunload', () => {
      this.saveInputValues();
      StateManager.saveToStorage(this.inputValues);
    });
  }

  /**
   * Handle input change event
   * @param inputId - ID of the input that changed
   */
  private static onInput(inputId: string): void {
    const inputMode = this.getModeByInputId(inputId);
    if (inputMode && inputMode !== StateManager.getMode()) {
      this.setMode(inputMode);
    }

    this.inputValues[inputId] = this.getInputValue(inputId);
    this.calculate(inputId);
  }

  /**
   * Get mode name by input element ID
   * @param inputId - Input element ID
   * @returns Mode string
   */
  private static getModeByInputId(inputId: string): string {
    if (inputId === 'pace_input' || inputId === 'pace_input2') {
      return 'pace';
    }
    if (inputId === 'track_input') {
      return 'track';
    }
    if (inputId === 'treadmill_input') {
      return 'treadmill';
    }
    if (inputId === 'finish_time_input') {
      return 'finish_time';
    }
    return StateManager.getMode();
  }

  /**
   * Main calculation function
   * @param sourceId - ID of the source input
   */
  private static calculate(sourceId: string): void {
    const state = StateManager.getState();

    // Parse input values
    const paceMin = parseFloat(this.dom.inputs.paceMin?.value || '0') || 0;
    const paceSec = parseFloat(this.dom.inputs.paceSec?.value || '0') || 0;
    const trackSec = parseFloat(this.dom.inputs.track?.value || '0') || 0;
    const treadmillVal = parseFloat(this.dom.inputs.treadmill?.value || '0') || 0;
    const finishTimeVal = this.dom.inputs.finishTime?.value || '';

    // Calculate secondsPerLap
    const secondsPerLap = Calculator.calculateSecondsPerLap(
      state.mode,
      state,
      paceMin,
      paceSec,
      trackSec,
      treadmillVal,
      finishTimeVal
    );

    if (secondsPerLap <= 0) return;

    // Update all displays
    this.updateDisplay(secondsPerLap, sourceId);
  }

  /**
   * Update all UI displays based on calculated secondsPerLap
   * @param secondsPerLap - Time for one lap
   * @param sourceId - Source input ID (to avoid updating same field)
   */
  private static updateDisplay(secondsPerLap: number, sourceId: string): void {
    const state = StateManager.getState();

    // Update track time
    if (sourceId !== 'track_input' && this.dom.inputs.track) {
      this.dom.inputs.track.value = Calculator.round(secondsPerLap, 2).toString();
      this.inputValues['track_input'] = this.dom.inputs.track.value;
    }

    // Update pace
    if (sourceId !== 'pace_input' && sourceId !== 'pace_input2') {
      let paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
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
        this.inputValues['pace_input'] = m;
      }
      if (this.dom.inputs.paceSec) {
        this.dom.inputs.paceSec.value = s;
        this.inputValues['pace_input2'] = s;
      }
    }

    // Update treadmill speed
    if (sourceId !== 'treadmill_input') {
      const kph = (state.lane * 3.6) / secondsPerLap;
      let val = kph;
      if (state.treadmillUnit === 'mile') {
        val = kph * CONVERSION_FACTORS.km_to_mile;
      }
      if (this.dom.inputs.treadmill) {
        this.dom.inputs.treadmill.value = Calculator.round(val, 2).toString();
        this.inputValues['treadmill_input'] = this.dom.inputs.treadmill.value;
      }
    }

    // Update finish time
    if (sourceId !== 'finish_time_input') {
      const totalTime = state.distance * (secondsPerLap / state.lane);
      if (this.dom.inputs.finishTime) {
        this.dom.inputs.finishTime.value = TimeFormatter.format(totalTime);
        this.inputValues['finish_time_input'] = this.dom.inputs.finishTime.value;
      }
    }

    // Update splits
    this.updateSplits(secondsPerLap);

    // Update zones
    const paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
    this.updateZones(paceSecondsPerKm);

    // Save current input values
    this.saveInputValues();
  }

  /**
   * Update split displays
   * @param secondsPerLap - Time for one lap
   */
  private static updateSplits(secondsPerLap: number): void {
    const state = StateManager.getState();
    const splits = Calculator.calculateSplits(secondsPerLap, state.lane);

    if (this.dom.displays.splits.m100) this.dom.displays.splits.m100.value = splits.m100;
    if (this.dom.displays.splits.m200) this.dom.displays.splits.m200.value = splits.m200;
    if (this.dom.displays.splits.m300) this.dom.displays.splits.m300.value = splits.m300;
    if (this.dom.displays.splits.m400) this.dom.displays.splits.m400.value = splits.m400;
    if (this.dom.displays.splits.m800) this.dom.displays.splits.m800.value = splits.m800;
    if (this.dom.displays.splits.m1200) this.dom.displays.splits.m1200.value = splits.m1200;
    if (this.dom.displays.splits.m1600) this.dom.displays.splits.m1600.value = splits.m1600;
    if (this.dom.displays.splits.m2000) this.dom.displays.splits.m2000.value = splits.m2000;

    if (this.dom.displays.splits.inc200) this.dom.displays.splits.inc200.value = splits.inc200;
    if (this.dom.displays.splits.inc300) this.dom.displays.splits.inc300.value = splits.inc300;
    if (this.dom.displays.splits.inc400) this.dom.displays.splits.inc400.value = splits.inc400;

    // Update lap text labels
    const m100 = (secondsPerLap / state.lane) * 100;
    const m200 = (secondsPerLap / state.lane) * 200;
    const m300 = (secondsPerLap / state.lane) * 300;
    const m400 = (secondsPerLap / state.lane) * 400;

    if (this.dom.displays.splits.lapsText.two) {
      this.dom.displays.splits.lapsText.two.innerHTML = `&emsp;${state.lane * 2}`;
    }
    if (this.dom.displays.splits.lapsText.three) {
      this.dom.displays.splits.lapsText.three.innerHTML = `${state.lane * 3}`;
    }
    if (this.dom.displays.splits.lapsText.four) {
      this.dom.displays.splits.lapsText.four.innerHTML = `${state.lane * 4}`;
    }
    if (this.dom.displays.splits.lapsText.five) {
      this.dom.displays.splits.lapsText.five.innerHTML = `${state.lane * 5}`;
    }

    // Update road splits if active
    if (StateManager.getSplitMode() === 'road') {
      this.updateRoadSplits(secondsPerLap);
    }
  }

  /**
   * Update training zone displays
   * @param paceSecondsPerKm - Pace in seconds per km
   */
  private static updateZones(paceSecondsPerKm: number): void {
    if (!paceSecondsPerKm || paceSecondsPerKm <= 0) return;

    const ref = paceSecondsPerKm;
    const z = this.dom.displays.zones;

    // E: +60s to +90s
    if (z.e) z.e.textContent = `${TimeFormatter.format(ref + 60)} - ${TimeFormatter.format(ref + 90)}`;
    // M: +25s to +45s
    if (z.m) z.m.textContent = `${TimeFormatter.format(ref + 25)} - ${TimeFormatter.format(ref + 45)}`;
    // T: +10s to +20s
    if (z.t) z.t.textContent = `${TimeFormatter.format(ref + 10)} - ${TimeFormatter.format(ref + 20)}`;
    // I: -10s to +0s
    if (z.i) z.i.textContent = `${TimeFormatter.format(ref - 10)} - ${TimeFormatter.format(ref)}`;
    // R: -20s to -10s
    if (z.r) z.r.textContent = `${TimeFormatter.format(ref - 20)} - ${TimeFormatter.format(ref - 10)}`;
  }

  /**
   * Update road splits display
   * @param secondsPerLap - Time for one lap
   */
  private static updateRoadSplits(secondsPerLap: number): void {
    const state = StateManager.getState();
    const roadContainer = document.getElementById('road-detail');
    if (!roadContainer) return;

    roadContainer.innerHTML = '';
    const t = TranslationManager.getAll();

    const splits = Calculator.generateRoadSplits(secondsPerLap, state.lane);

    splits.forEach((split) => {
      const row = document.createElement('div');
      row.className = 'road-row';

      let isWater = true;
      if (Math.abs(split.distance - HALF_MARATHON_METERS) < 1 || Math.abs(split.distance - FULL_MARATHON_METERS) < 1) {
        isWater = false;
      }

      const waterHtml = isWater ? `<span class="water-icon">${t.label_water || '💧'}</span>` : '';

      row.innerHTML = `
        <div>${waterHtml}<span class="road-dist">${split.label}</span></div>
        <div class="road-time">${split.time}</div>
      `;

      if (split.distance % 5000 === 0 || Math.abs(split.distance - FULL_MARATHON_METERS) < 1 || Math.abs(split.distance - HALF_MARATHON_METERS) < 1) {
        row.style.borderLeft = '3px solid var(--highlight)';
        row.style.background = 'var(--option-bg)';
      }

      roadContainer.appendChild(row);
    });
  }

  /**
   * Set application mode
   * @param newMode - New mode to set
   */
  static setMode(newMode: string): void {
    const validModes: TMode[] = ['pace', 'track', 'treadmill', 'finish_time'];
    if (!validModes.includes(newMode as TMode)) return;
    StateManager.setMode(newMode as TMode);
    
    const radio = document.querySelector(`input[name="type"][value="${newMode}"]`) as HTMLInputElement;
    if (radio) radio.checked = true;

    document.querySelectorAll('.row').forEach((el) => el.classList.remove('selected'));
    const modeIcon = document.getElementById(`${newMode}_icon`);
    if (modeIcon) modeIcon.classList.add('selected');

    this.clearPlaceholders();
    this.setPlaceholders(newMode);

    const inputId = getInputIdForMode(newMode);
    this.highlightInput(inputId);
  }

  /**
   * Toggle pace unit (km / mile)
   */
  private static togglePaceUnit(): void {
    const current = StateManager.getPaceUnit();
    const newUnit = current === 'km' ? 'mile' : 'km';
    StateManager.setPaceUnit(newUnit);

    if (this.dom.buttons.mileSwitchText) {
      this.dom.buttons.mileSwitchText.textContent = newUnit === 'km' ? '(Km)' : '(Mile)';
    }

    // Recalculate with new unit
    const inputId = getInputIdForMode(StateManager.getMode());
    this.calculate(inputId);
  }

  /**
   * Toggle treadmill unit (km / mile)
   */
  private static toggleTreadmillUnit(): void {
    const current = StateManager.getTreadmillUnit();
    const newUnit = current === 'km' ? 'mile' : 'km';
    StateManager.setTreadmillUnit(newUnit);

    if (this.dom.buttons.perHourSwitchText) {
      this.dom.buttons.perHourSwitchText.textContent = newUnit === 'km' ? '(Km/h)' : '(Mile/h)';
    }

    // Recalculate with new unit
    const inputId = getInputIdForMode(StateManager.getMode());
    this.calculate(inputId);
  }

  /**
   * Handle venue change
   */
  private static onVenueChange(): void {
    const venue = this.dom.venueSelect?.value;
    if (venue) {
      StateManager.setVenue(venue);
      this.populateVenues();
      this.onLaneChange();
    }
  }

  /**
   * Handle lane change
   */
  private static onLaneChange(): void {
    const laneValue = this.dom.laneSelect?.value;
    if (laneValue) {
      const lane = parseInt(laneValue, 10);
      StateManager.setLane(lane);
      this.updateLaneState();
    }
  }

  /**
   * Populate venues dropdown
   */
  private static populateVenues(): void {
    if (!this.dom.venueSelect) return;

    this.dom.venueSelect.innerHTML = '';
    const t = TranslationManager.getAll();
    const state = StateManager.getState();

    const venueMap: Record<string, string> = {
      'standard_400': t.venue_400 || '台北田徑場 (400m)',
      'warmup_300': t.venue_300 || '台北暖身場 (300m)'
    };

    Object.values(VENUES).forEach((venue) => {
      const opt = document.createElement('option');
      opt.value = venue.id;
      opt.textContent = venueMap[venue.id] || venue.name;
      this.dom.venueSelect!.appendChild(opt);
    });

    this.dom.venueSelect.value = state.venue;
    this.populateLanes();
  }

  /**
   * Populate lanes dropdown
   */
  private static populateLanes(): void {
    if (!this.dom.laneSelect) return;

    const venue = VENUES[StateManager.getVenue() as keyof typeof VENUES];
    if (!venue) return;

    this.dom.laneSelect.innerHTML = '';
    const t = TranslationManager.getAll();
    const state = StateManager.getState();

    venue.lanes.forEach((lane) => {
      const opt = document.createElement('option');
      opt.value = lane.dist.toString();
      opt.textContent = `${t.lane_prefix || '第'}${lane.id}${t.lane_suffix || '道'}`;
      this.dom.laneSelect!.appendChild(opt);
    });

    if (state.lane && venue.lanes.find((l) => l.dist === state.lane)) {
      this.dom.laneSelect.value = state.lane.toString();
    } else {
      this.dom.laneSelect.value = venue.lanes[0].dist.toString();
    }

    this.updateLaneState();
  }

  /**
   * Update lane state and recalculate
   */
  private static updateLaneState(): void {
    const laneValue = this.dom.laneSelect?.value;
    if (!laneValue) return;

    const lane = parseInt(laneValue, 10);
    StateManager.setLane(lane);

    if (this.dom.displays.laneLength) {
      this.dom.displays.laneLength.textContent = `${lane}m`;
    }

    // Recalculate
    const currentInput = getInputIdForMode(StateManager.getMode());
    const value = this.getInputValue(currentInput);
    if (value) {
      this.calculate(currentInput);
    }
  }

  /**
   * Toggle theme
   */
  private static toggleTheme(): void {
    const newTheme = StateManager.toggleTheme();
    this.applyTheme();
  }

  /**
   * Apply theme to document
   */
  private static applyTheme(): void {
    const theme = StateManager.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    if (this.dom.displays.themeIcon) {
      this.dom.displays.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  /**
   * Toggle language
   */
  private static toggleLanguage(): void {
    TranslationManager.toggleLanguage();
    this.applyLanguage();
  }

  /**
   * Apply language to UI
   */
  private static applyLanguage(): void {
    const lang = TranslationManager.getCurrentLanguage();
    TranslationManager.updateDOMTranslations();
    this.populateVenues();
    
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
      langBtn.textContent = lang === 'zh' ? '中/EN' : 'EN/中';
    }

    document.title = lang === 'zh' ? 'RunningPaceNote 配速計算機' : 'RunningPaceNote Calculator';
  }

  /**
   * Copy results to clipboard
   */
  private static copyResults(): void {
    const t = TranslationManager.getAll();
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
      .then(() => {
        alert(t.copy_success || '✅ 已複製');
      })
      .catch(() => {
        alert(t.copy_fail || '複製失敗');
      });
  }

  /**
   * Switch split mode (track vs road)
   * @param mode - Split mode to switch to
   */
  private static switchSplitMode(mode: 'track' | 'road'): void {
    StateManager.setSplitMode(mode);
    const currentInput = getInputIdForMode(StateManager.getMode());
    const value = this.getInputValue(currentInput);
    if (value) {
      const trackSec = parseFloat(this.dom.inputs.track?.value || '0') || 0;
      if (trackSec > 0) {
        this.updateSplits(trackSec);
      }
    }
  }

  /**
   * Highlight current input
   * @param inputId - Input ID to highlight
   */
  private static highlightInput(inputId: string): void {
    Object.values(this.dom.inputs).forEach((el) => {
      if (el) el.style.color = '';
    });

    const el = document.getElementById(inputId);
    if (el) {
      el.style.color = 'var(--highlight)';
    }

    if (inputId === 'pace_input' || inputId === 'pace_input2') {
      if (this.dom.inputs.paceMin) this.dom.inputs.paceMin.style.color = 'var(--highlight)';
      if (this.dom.inputs.paceSec) this.dom.inputs.paceSec.style.color = 'var(--highlight)';
    }
  }

  /**
   * Set placeholders for a mode
   * @param mode - Mode to set placeholders for
   */
  private static setPlaceholders(mode: string): void {
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
      if (this.dom.inputs.treadmill) this.dom.inputs.treadmill.placeholder = placeholders.toString();
      this.highlightInput('treadmill_input');
    } else if (mode === 'finish_time') {
      if (this.dom.inputs.finishTime) this.dom.inputs.finishTime.placeholder = placeholders.toString();
      this.highlightInput('finish_time_input');
    }
  }

  /**
   * Clear all placeholders
   */
  private static clearPlaceholders(): void {
    Object.values(this.dom.inputs).forEach((el) => {
      if (el) el.placeholder = '';
    });
  }

  /**
   * Get input value by ID
   * @param inputId - Input ID
   * @returns Input value or empty string
   */
  private static getInputValue(inputId: string): string {
    return (document.getElementById(inputId) as HTMLInputElement)?.value || '';
  }

  /**
   * Save current input values to cache
   */
  private static saveInputValues(): void {
    this.inputValues = {
      'pace_input': this.dom.inputs.paceMin?.value || '',
      'pace_input2': this.dom.inputs.paceSec?.value || '',
      'track_input': this.dom.inputs.track?.value || '',
      'treadmill_input': this.dom.inputs.treadmill?.value || '',
      'finish_time_input': this.dom.inputs.finishTime?.value || ''
    };
  }

  /**
   * Load saved inputs from localStorage
   */
  private static loadSavedInputs(): void {
    const saved = StorageManager.loadState();
    if (!saved || !saved.inputs) return;

    const inputs = saved.inputs;
    if (this.dom.inputs.paceMin && inputs['pace_input']) {
      this.dom.inputs.paceMin.value = inputs['pace_input'];
    }
    if (this.dom.inputs.paceSec && inputs['pace_input2']) {
      this.dom.inputs.paceSec.value = inputs['pace_input2'];
    }
    if (this.dom.inputs.track && inputs['track_input']) {
      this.dom.inputs.track.value = inputs['track_input'];
    }
    if (this.dom.inputs.treadmill && inputs['treadmill_input']) {
      this.dom.inputs.treadmill.value = inputs['treadmill_input'];
    }
    if (this.dom.inputs.finishTime && inputs['finish_time_input']) {
      this.dom.inputs.finishTime.value = inputs['finish_time_input'];
    }

    this.saveInputValues();
  }

  /**
   * Toggle advanced tools visibility
   */
  private static toggleAdvancedTools(): void {
    const advancedTools = document.getElementById('advanced-tools');
    if (advancedTools) {
      advancedTools.classList.toggle('SlideDown');
    }
  }

  /**
   * Toggle splits container (#container) visibility
   * Triggered by the "+" button next to the track input
   */
  private static toggleSplitsContainer(): void {
    if (this.dom.displays.container) {
      this.dom.displays.container.classList.toggle('SlideDown');
    }
  }

  /**
   * Toggle info container (#container2) visibility
   * Triggered by the info button in the header
   */
  private static toggleInfoContainer(): void {
    if (this.dom.displays.infoContainer) {
      this.dom.displays.infoContainer.classList.toggle('SlideDown');
    }
  }

  /**
   * Calculate race prediction using Riegel's formula
   */
  private static calculatePrediction(): void {
    const predDistSelect = document.getElementById('pred-dist-select') as HTMLSelectElement;
    const predTimeInput = document.getElementById('pred-time-input') as HTMLInputElement;

    if (!predDistSelect || !predTimeInput) return;

    const dist = parseFloat(predDistSelect.value);
    const timeStr = predTimeInput.value;
    const timeSec = TimeFormatter.parse(timeStr);
    const p = this.dom.displays.prediction;
    const setEl = (el: HTMLElement | null, val: string) => { if (el) el.textContent = val; };

    if (!dist || !timeSec) {
      setEl(p.k5, '--');
      setEl(p.k10, '--');
      setEl(p.half, '--');
      setEl(p.full, '--');
      return;
    }

    // T2 = T1 * (D2 / D1)^1.06 (Riegel's formula)
    const predict = (d2: number): string => {
      const t2 = timeSec * Math.pow(d2 / dist, 1.06);
      return TimeFormatter.format(t2);
    };

    setEl(p.k5, predict(5000));
    setEl(p.k10, predict(10000));
    setEl(p.half, predict(HALF_MARATHON_METERS));
    setEl(p.full, predict(FULL_MARATHON_METERS));
  }
}

export default UIController;
