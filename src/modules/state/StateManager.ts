/**
 * StateManager Module
 * Manages global application state with centralized updates
 */

import { DEFAULT_STATE } from '../../constants/index.js';
import StorageManager from './StorageManager.js';
import type { IPaceState, TMode, TUnit, TTheme, TLanguage, TSplitMode } from '../../types/index';

export class StateManager {
  private static state: IPaceState = { ...DEFAULT_STATE };
  private static listeners: Array<(state: IPaceState) => void> = [];

  /**
   * Subscribe to state updates. Returns unsubscribe function.
   */
  static subscribe(listener: (state: IPaceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all subscribed listeners
   */
  private static notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error notifying StateManager listener:', error);
      }
    });
  }

  /**
   * Initialize state from defaults and localStorage
   */
  static initialize(): void {
    const saved = StorageManager.loadState();
    if (saved && saved.state) {
      this.state = { ...this.state, ...saved.state };
    }

    const savedTheme = StorageManager.loadTheme();
    if (savedTheme) this.state.theme = savedTheme;

    const savedLang = StorageManager.loadLanguage();
    if (savedLang) this.state.lang = savedLang;
  }

  /**
   * Get current state (shallow copy)
   */
  static getState(): IPaceState {
    return { ...this.state };
  }

  /**
   * Get specific state property
   */
  static get<K extends keyof IPaceState>(key: K): IPaceState[K] {
    return this.state[key];
  }

  /**
   * Update state with partial updates
   */
  static setState(updates: Partial<IPaceState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Update single state property
   */
  static set<K extends keyof IPaceState>(key: K, value: IPaceState[K]): void {
    this.state[key] = value;
    this.notify();
  }

  // ── Methods retained because they carry logic or trigger side effects ──

  static getMode(): TMode {
    return this.state.mode;
  }
  static setMode(mode: TMode): void {
    this.setState({ mode });
  }

  static getPaceUnit(): TUnit {
    return this.state.paceUnit;
  }
  static setPaceUnit(unit: TUnit): void {
    this.setState({ paceUnit: unit });
  }

  static getTreadmillUnit(): TUnit {
    return this.state.treadmillUnit;
  }
  static setTreadmillUnit(unit: TUnit): void {
    this.setState({ treadmillUnit: unit });
  }

  static getVenue(): string {
    return this.state.venue;
  }
  static setVenue(venue: string): void {
    this.setState({ venue });
  }

  static getLane(): number {
    return this.state.lane;
  }
  static setLane(lane: number): void {
    this.setState({ lane });
  }

  static getDistance(): number {
    return this.state.distance;
  }
  static setDistance(distance: number): void {
    this.setState({ distance });
  }

  static getTrackDistance(): number {
    return this.state.trackDistance || 400;
  }
  static setTrackDistance(trackDistance: number): void {
    this.setState({ trackDistance });
  }

  static getPlanType(): 'running' | 'triathlon' {
    return this.state.planType || 'running';
  }
  static setPlanType(planType: 'running' | 'triathlon'): void {
    this.setState({ planType });
  }

  static getGasApiUrl(): string {
    return this.state.gasApiUrl || '';
  }
  static setGasApiUrl(url: string): void {
    this.setState({ gasApiUrl: url });
  }

  static getActiveTab(): string {
    return this.state.activeTab || 'tab-pace';
  }
  static setActiveTab(tabId: string): void {
    this.setState({ activeTab: tabId });
  }

  static getTriDistance(): 51.5 | 113 | 226 {
    return this.state.triDistance || 51.5;
  }
  static setTriDistance(distance: 51.5 | 113 | 226): void {
    this.setState({ triDistance: distance });
  }

  static getTriInputs() {
    return this.state.triInputs;
  }
  static setTriInputs(inputs: any): void {
    this.setState({ triInputs: inputs });
  }

  static getSplitMode(): TSplitMode {
    return this.state.splitMode;
  }
  static setSplitMode(mode: TSplitMode): void {
    this.setState({ splitMode: mode });
  }

  static getLanguage(): TLanguage {
    return this.state.lang;
  }

  /**
   * Set language and persist to storage
   */
  static setLanguage(lang: TLanguage): void {
    this.setState({ lang });
    StorageManager.saveLanguage(lang);
  }

  /**
   * Toggle language and persist
   */
  static toggleLanguage(): TLanguage {
    const newLang = this.state.lang === 'zh' ? 'en' : 'zh';
    this.setLanguage(newLang);
    return newLang;
  }

  static getTheme(): TTheme {
    return this.state.theme;
  }

  /**
   * Set theme and persist to storage
   */
  static setTheme(theme: TTheme): void {
    this.setState({ theme });
    StorageManager.saveTheme(theme);
  }

  /**
   * Toggle theme and persist
   */
  static toggleTheme(): TTheme {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Save current state to localStorage
   */
  static saveToStorage(inputs: Record<string, string> = {}): void {
    StorageManager.saveState(this.state, inputs);
  }

  /**
   * Load state from localStorage (already done in initialize, exposed for manual refresh)
   */
  static loadFromStorage(): void {
    const saved = StorageManager.loadState();
    if (saved && saved.state) {
      this.state = { ...this.state, ...saved.state };
    }
  }

  /**
   * Reset state to defaults
   */
  static reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.notify();
  }

  /**
   * Clear all persisted data and reset state
   */
  static clearStorage(): void {
    StorageManager.clear();
    this.reset();
  }
}

export default StateManager;
