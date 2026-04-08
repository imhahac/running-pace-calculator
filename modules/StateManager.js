import { DEFAULT_STATE } from '../constants/index.js';
import StorageManager from './StorageManager.js';
export class StateManager {
    static initialize() {
        const saved = StorageManager.loadState();
        if (saved && saved.state) {
            this.state = { ...this.state, ...saved.state };
        }
        const savedTheme = StorageManager.loadTheme();
        if (savedTheme)
            this.state.theme = savedTheme;
        const savedLang = StorageManager.loadLanguage();
        if (savedLang)
            this.state.lang = savedLang;
    }
    static getState() {
        return { ...this.state };
    }
    static get(key) {
        return this.state[key];
    }
    static setState(updates) {
        this.state = { ...this.state, ...updates };
    }
    static set(key, value) {
        this.state[key] = value;
    }
    static getMode() { return this.state.mode; }
    static setMode(mode) { this.setState({ mode }); }
    static getPaceUnit() { return this.state.paceUnit; }
    static setPaceUnit(unit) { this.setState({ paceUnit: unit }); }
    static getTreadmillUnit() { return this.state.treadmillUnit; }
    static setTreadmillUnit(unit) { this.setState({ treadmillUnit: unit }); }
    static getVenue() { return this.state.venue; }
    static setVenue(venue) { this.setState({ venue }); }
    static getLane() { return this.state.lane; }
    static setLane(lane) { this.setState({ lane }); }
    static getDistance() { return this.state.distance; }
    static setDistance(distance) { this.setState({ distance }); }
    static getSplitMode() { return this.state.splitMode; }
    static setSplitMode(mode) { this.setState({ splitMode: mode }); }
    static getLanguage() { return this.state.lang; }
    static setLanguage(lang) {
        this.setState({ lang });
        StorageManager.saveLanguage(lang);
    }
    static toggleLanguage() {
        const newLang = this.state.lang === 'zh' ? 'en' : 'zh';
        this.setLanguage(newLang);
        return newLang;
    }
    static getTheme() { return this.state.theme; }
    static setTheme(theme) {
        this.setState({ theme });
        StorageManager.saveTheme(theme);
    }
    static toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        return newTheme;
    }
    static saveToStorage(inputs = {}) {
        StorageManager.saveState(this.state, inputs);
    }
    static loadFromStorage() {
        const saved = StorageManager.loadState();
        if (saved && saved.state) {
            this.state = { ...this.state, ...saved.state };
        }
    }
    static reset() {
        this.state = { ...DEFAULT_STATE };
    }
    static clearStorage() {
        StorageManager.clear();
        this.reset();
    }
}
StateManager.state = { ...DEFAULT_STATE };
export default StateManager;
