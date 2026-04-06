import { getDOMCache, getInputIdForMode } from '../constants/domElements.js';
import { VENUES, MODE_PLACEHOLDERS } from '../constants/index.js';
import StateManager from './StateManager.js';
import Calculator from './Calculator.js';
import TimeFormatter from './TimeFormatter.js';
import TranslationManager from './TranslationManager.js';
import StorageManager from './StorageManager.js';
export class UIController {
    static initialize() {
        this.dom = getDOMCache();
        this.loadSavedInputs();
        this.applyTheme();
        this.applyLanguage();
    }
    static bindEvents() {
        if (!this.dom)
            return;
        this.dom.radios?.forEach((radio) => {
            radio.addEventListener('change', (e) => {
                const target = e.target;
                this.setMode(target.value);
            });
        });
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
        if (this.dom.buttons.mile) {
            this.dom.buttons.mile.addEventListener('click', () => this.togglePaceUnit());
        }
        if (this.dom.buttons.perHour) {
            this.dom.buttons.perHour.addEventListener('click', () => this.toggleTreadmillUnit());
        }
        if (this.dom.venueSelect) {
            this.dom.venueSelect.addEventListener('change', () => this.onVenueChange());
        }
        if (this.dom.laneSelect) {
            this.dom.laneSelect.addEventListener('change', () => this.onLaneChange());
        }
        if (this.dom.buttons.theme) {
            this.dom.buttons.theme.addEventListener('click', () => this.toggleTheme());
        }
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => this.toggleLanguage());
        }
        const copyBtn = document.getElementById('copy-button');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyResults());
        }
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.target;
                const tabName = target.getAttribute('data-tab');
                if (tabName) {
                    this.switchSplitMode(tabName);
                }
            });
        });
        window.addEventListener('beforeunload', () => {
            this.saveInputValues();
            StateManager.saveToStorage(this.inputValues);
        });
    }
    static onInput(inputId) {
        this.inputValues[inputId] = this.getInputValue(inputId);
        this.calculate(inputId);
    }
    static calculate(sourceId) {
        const state = StateManager.getState();
        const paceMin = parseFloat(this.dom.inputs.paceMin?.value || '0') || 0;
        const paceSec = parseFloat(this.dom.inputs.paceSec?.value || '0') || 0;
        const trackSec = parseFloat(this.dom.inputs.track?.value || '0') || 0;
        const treadmillVal = parseFloat(this.dom.inputs.treadmill?.value || '0') || 0;
        const finishTimeVal = this.dom.inputs.finishTime?.value || '';
        const secondsPerLap = Calculator.calculateSecondsPerLap(state.mode, state, paceMin, paceSec, trackSec, treadmillVal, finishTimeVal);
        if (secondsPerLap <= 0)
            return;
        this.updateDisplay(secondsPerLap, sourceId);
    }
    static updateDisplay(secondsPerLap, sourceId) {
        const state = StateManager.getState();
        if (sourceId !== 'track_input' && this.dom.inputs.track) {
            this.dom.inputs.track.value = Calculator.round(secondsPerLap, 2).toString();
            this.inputValues['track_input'] = this.dom.inputs.track.value;
        }
        if (sourceId !== 'pace_input' && sourceId !== 'pace_input2') {
            let paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
            let finalPaceSeconds = paceSecondsPerKm;
            if (state.paceUnit === 'mile') {
                finalPaceSeconds = paceSecondsPerKm * 0.621371192;
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
        if (sourceId !== 'treadmill_input') {
            const kph = (state.lane * 3.6) / secondsPerLap;
            let val = kph;
            if (state.treadmillUnit === 'mile') {
                val = kph * 0.621371192;
            }
            if (this.dom.inputs.treadmill) {
                this.dom.inputs.treadmill.value = Calculator.round(val, 2).toString();
                this.inputValues['treadmill_input'] = this.dom.inputs.treadmill.value;
            }
        }
        if (sourceId !== 'finish_time_input') {
            const totalTime = state.distance * (secondsPerLap / state.lane);
            if (this.dom.inputs.finishTime) {
                this.dom.inputs.finishTime.value = TimeFormatter.format(totalTime);
                this.inputValues['finish_time_input'] = this.dom.inputs.finishTime.value;
            }
        }
        this.updateSplits(secondsPerLap);
        const paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
        this.updateZones(paceSecondsPerKm);
        this.saveInputValues();
    }
    static updateSplits(secondsPerLap) {
        const state = StateManager.getState();
        const splits = Calculator.calculateSplits(secondsPerLap, state.lane);
        if (this.dom.displays.splits.m100)
            this.dom.displays.splits.m100.value = splits.m100;
        if (this.dom.displays.splits.m200)
            this.dom.displays.splits.m200.value = splits.m200;
        if (this.dom.displays.splits.m300)
            this.dom.displays.splits.m300.value = splits.m300;
        if (this.dom.displays.splits.m400)
            this.dom.displays.splits.m400.value = splits.m400;
        if (this.dom.displays.splits.m800)
            this.dom.displays.splits.m800.value = splits.m800;
        if (this.dom.displays.splits.m1200)
            this.dom.displays.splits.m1200.value = splits.m1200;
        if (this.dom.displays.splits.m1600)
            this.dom.displays.splits.m1600.value = splits.m1600;
        if (this.dom.displays.splits.m2000)
            this.dom.displays.splits.m2000.value = splits.m2000;
        if (this.dom.displays.splits.inc200)
            this.dom.displays.splits.inc200.value = splits.inc200;
        if (this.dom.displays.splits.inc300)
            this.dom.displays.splits.inc300.value = splits.inc300;
        if (this.dom.displays.splits.inc400)
            this.dom.displays.splits.inc400.value = splits.inc400;
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
        if (StateManager.getSplitMode() === 'road') {
            this.updateRoadSplits(secondsPerLap);
        }
    }
    static updateZones(paceSecondsPerKm) {
        const zones = Calculator.calculateTrainingZones(paceSecondsPerKm);
    }
    static updateRoadSplits(secondsPerLap) {
        const state = StateManager.getState();
        const roadContainer = document.getElementById('road-detail');
        if (!roadContainer)
            return;
        roadContainer.innerHTML = '';
        const t = TranslationManager.getAll();
        const splits = Calculator.generateRoadSplits(secondsPerLap, state.lane);
        splits.forEach((split) => {
            const row = document.createElement('div');
            row.className = 'road-row';
            let isWater = true;
            if (Math.abs(split.distance - 21097.5) < 1 || Math.abs(split.distance - 42195) < 1) {
                isWater = false;
            }
            const waterHtml = isWater ? `<span class="water-icon">${t.label_water || '💧'}</span>` : '';
            row.innerHTML = `
        <div>${waterHtml}<span class="road-dist">${split.label}</span></div>
        <div class="road-time">${split.time}</div>
      `;
            if (split.distance % 5000 === 0 || Math.abs(split.distance - 42195) < 1 || Math.abs(split.distance - 21097.5) < 1) {
                row.style.borderLeft = '3px solid var(--highlight)';
                row.style.background = 'var(--option-bg)';
            }
            roadContainer.appendChild(row);
        });
    }
    static setMode(newMode) {
        StateManager.setMode(newMode);
        const radio = document.querySelector(`input[name="type"][value="${newMode}"]`);
        if (radio)
            radio.checked = true;
        document.querySelectorAll('.row').forEach((el) => el.classList.remove('selected'));
        const modeIcon = document.getElementById(`${newMode}_icon`);
        if (modeIcon)
            modeIcon.classList.add('selected');
        this.clearPlaceholders();
        this.setPlaceholders(newMode);
        const inputId = getInputIdForMode(newMode);
        this.highlightInput(inputId);
    }
    static togglePaceUnit() {
        const current = StateManager.getPaceUnit();
        const newUnit = current === 'km' ? 'mile' : 'km';
        StateManager.setPaceUnit(newUnit);
        if (this.dom.buttons.mileSwitchText) {
            this.dom.buttons.mileSwitchText.textContent = newUnit === 'km' ? '(Km)' : '(Mile)';
        }
        const inputId = getInputIdForMode(StateManager.getMode());
        this.calculate(inputId);
    }
    static toggleTreadmillUnit() {
        const current = StateManager.getTreadmillUnit();
        const newUnit = current === 'km' ? 'mile' : 'km';
        StateManager.setTreadmillUnit(newUnit);
        if (this.dom.buttons.perHourSwitchText) {
            this.dom.buttons.perHourSwitchText.textContent = newUnit === 'km' ? '(Km/h)' : '(Mile/h)';
        }
        const inputId = getInputIdForMode(StateManager.getMode());
        this.calculate(inputId);
    }
    static onVenueChange() {
        const venue = this.dom.venueSelect?.value;
        if (venue) {
            StateManager.setVenue(venue);
            this.populateVenues();
            this.onLaneChange();
        }
    }
    static onLaneChange() {
        const laneValue = this.dom.laneSelect?.value;
        if (laneValue) {
            const lane = parseInt(laneValue, 10);
            StateManager.setLane(lane);
            this.updateLaneState();
        }
    }
    static populateVenues() {
        if (!this.dom.venueSelect)
            return;
        this.dom.venueSelect.innerHTML = '';
        const t = TranslationManager.getAll();
        const state = StateManager.getState();
        const venueMap = {
            'standard_400': t.venue_400 || '台北田徑場 (400m)',
            'warmup_300': t.venue_300 || '台北暖身場 (300m)'
        };
        Object.values(VENUES).forEach((venue) => {
            const opt = document.createElement('option');
            opt.value = venue.id;
            opt.textContent = venueMap[venue.id] || venue.name;
            this.dom.venueSelect.appendChild(opt);
        });
        this.dom.venueSelect.value = state.venue;
        this.populateLanes();
    }
    static populateLanes() {
        if (!this.dom.laneSelect)
            return;
        const venue = VENUES[StateManager.getVenue()];
        if (!venue)
            return;
        this.dom.laneSelect.innerHTML = '';
        const t = TranslationManager.getAll();
        const state = StateManager.getState();
        venue.lanes.forEach((lane) => {
            const opt = document.createElement('option');
            opt.value = lane.dist.toString();
            opt.textContent = `${t.lane_prefix || '第'}${lane.id}${t.lane_suffix || '道'}`;
            this.dom.laneSelect.appendChild(opt);
        });
        if (state.lane && venue.lanes.find((l) => l.dist === state.lane)) {
            this.dom.laneSelect.value = state.lane.toString();
        }
        else {
            this.dom.laneSelect.value = venue.lanes[0].dist.toString();
        }
        this.updateLaneState();
    }
    static updateLaneState() {
        const laneValue = this.dom.laneSelect?.value;
        if (!laneValue)
            return;
        const lane = parseInt(laneValue, 10);
        StateManager.setLane(lane);
        if (this.dom.displays.laneLength) {
            this.dom.displays.laneLength.textContent = `${lane}m`;
        }
        const currentInput = getInputIdForMode(StateManager.getMode());
        const value = this.getInputValue(currentInput);
        if (value) {
            this.calculate(currentInput);
        }
    }
    static toggleTheme() {
        const newTheme = StateManager.toggleTheme();
        this.applyTheme();
    }
    static applyTheme() {
        const theme = StateManager.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        if (this.dom.displays.themeIcon) {
            this.dom.displays.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
    }
    static toggleLanguage() {
        TranslationManager.toggleLanguage();
        this.applyLanguage();
    }
    static applyLanguage() {
        const lang = TranslationManager.getCurrentLanguage();
        TranslationManager.updateDOMTranslations();
        this.populateVenues();
        const langBtn = document.getElementById('lang-toggle');
        if (langBtn) {
            langBtn.textContent = lang === 'zh' ? '中/EN' : 'EN/中';
        }
        document.title = lang === 'zh' ? 'RunningPaceNote 配速計算機' : 'RunningPaceNote Calculator';
    }
    static copyResults() {
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
    static switchSplitMode(mode) {
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
    static highlightInput(inputId) {
        Object.values(this.dom.inputs).forEach((el) => {
            if (el)
                el.style.color = '';
        });
        const el = document.getElementById(inputId);
        if (el) {
            el.style.color = 'var(--highlight)';
        }
        if (inputId === 'pace_input' || inputId === 'pace_input2') {
            if (this.dom.inputs.paceMin)
                this.dom.inputs.paceMin.style.color = 'var(--highlight)';
            if (this.dom.inputs.paceSec)
                this.dom.inputs.paceSec.style.color = 'var(--highlight)';
        }
    }
    static setPlaceholders(mode) {
        const placeholders = MODE_PLACEHOLDERS[mode];
        if (!placeholders)
            return;
        if (mode === 'pace' && Array.isArray(placeholders)) {
            if (this.dom.inputs.paceMin)
                this.dom.inputs.paceMin.placeholder = placeholders[0];
            if (this.dom.inputs.paceSec)
                this.dom.inputs.paceSec.placeholder = placeholders[1];
            this.highlightInput('pace_input');
        }
        else if (mode === 'track') {
            if (this.dom.inputs.track)
                this.dom.inputs.track.placeholder = placeholders.toString();
            this.highlightInput('track_input');
        }
        else if (mode === 'treadmill') {
            if (this.dom.inputs.treadmill)
                this.dom.inputs.treadmill.placeholder = placeholders.toString();
            this.highlightInput('treadmill_input');
        }
        else if (mode === 'finish_time') {
            if (this.dom.inputs.finishTime)
                this.dom.inputs.finishTime.placeholder = placeholders.toString();
            this.highlightInput('finish_time_input');
        }
    }
    static clearPlaceholders() {
        Object.values(this.dom.inputs).forEach((el) => {
            if (el)
                el.placeholder = '';
        });
    }
    static getInputValue(inputId) {
        return document.getElementById(inputId)?.value || '';
    }
    static saveInputValues() {
        this.inputValues = {
            'pace_input': this.dom.inputs.paceMin?.value || '',
            'pace_input2': this.dom.inputs.paceSec?.value || '',
            'track_input': this.dom.inputs.track?.value || '',
            'treadmill_input': this.dom.inputs.treadmill?.value || '',
            'finish_time_input': this.dom.inputs.finishTime?.value || ''
        };
    }
    static loadSavedInputs() {
        const saved = StorageManager.loadState();
        if (!saved || !saved.inputs)
            return;
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
}
UIController.dom = getDOMCache();
UIController.inputValues = {};
export default UIController;
