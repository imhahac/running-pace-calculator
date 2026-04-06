/**
 * StateManager Module
 * Manages global application state with centralized updates
 */

import { DEFAULT_STATE } from '../constants/index.js';
import StorageManager from './StorageManager.js';
import type { IPaceState, TMode, TUnit, TTheme, TLanguage, TSplitMode } from '../types/index';

export class StateManager {
  private static state: IPaceState = { ...DEFAULT_STATE };

  /**
   * Initialize state from defaults and localStorage
   */
  static initialize(): void {
    // Load from localStorage if available
    const saved = StorageManager.loadState();
    if (saved && saved.state) {
      this.state = { ...this.state, ...saved.state };
    }

    // Load theme and language separately
    const savedTheme = StorageManager.loadTheme();
    if (savedTheme) {
      this.state.theme = savedTheme;
    }

    const savedLang = StorageManager.loadLanguage();
    if (savedLang) {
      this.state.lang = savedLang;
    }
  }

  /**
   * Get current state
   * @returns Current application state (shallow copy)
   */
  static getState(): IPaceState {
    return { ...this.state };
  }

  /**
   * Get specific state property
   * @param key - State property key
   * @returns Property value or undefined
   */
  static get<K extends keyof IPaceState>(key: K): IPaceState[K] {
    return this.state[key];
  }

  /**
   * Update state with partial updates
   * @param updates - Partial state updates
   */
  static setState(updates: Partial<IPaceState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Update single state property
   * @param key - Property key
   * @param value - New value
   */
  static set<K extends keyof IPaceState>(key: K, value: IPaceState[K]): void {
    this.state[key] = value;
  }

  // Convenience methods for common state updates

  /**
   * Get current mode
   */
  static getMode(): TMode {
    return this.state.mode;
  }

  /**
   * Set mode
   */
  static setMode(mode: TMode): void {
    this.setState({ mode });
  }

  /**
   * Get pace unit
   */
  static getPaceUnit(): TUnit {
    return this.state.paceUnit;
  }

  /**
   * Set pace unit
   */
  static setPaceUnit(unit: TUnit): void {
    this.setState({ paceUnit: unit });
  }

  /**
   * Get treadmill unit
   */
  static getTreadmillUnit(): TUnit {
    return this.state.treadmillUnit;
  }

  /**
   * Set treadmill unit
   */
  static setTreadmillUnit(unit: TUnit): void {
    this.setState({ treadmillUnit: unit });
  }

  /**
   * Get current venue
   */
  static getVenue(): string {
    return this.state.venue;
  }

  /**
   * Set venue
   */
  static setVenue(venue: string): void {
    this.setState({ venue });
  }

  /**
   * Get current lane distance
   */
  static getLane(): number {
    return this.state.lane;
  }

  /**
   * Set lane distance
   */
  static setLane(lane: number): void {
    this.setState({ lane });
  }

  /**
   * Get target distance
   */
  static getDistance(): number {
    return this.state.distance;
  }

  /**
   * Set target distance
   */
  static setDistance(distance: number): void {
    this.setState({ distance });
  }

  /**
   * Get theme
   */
  static getTheme(): TTheme {
    return this.state.theme;
  }

  /**
   * Set theme and persist
   */
  static setTheme(theme: TTheme): void {
    this.setState({ theme });
    StorageManager.saveTheme(theme);
  }

  /**
   * Toggle theme
   */
  static toggleTheme(): TTheme {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Get language
   */
  static getLanguage(): TLanguage {
    return this.state.lang;
  }

  /**
   * Set language and persist
   */
  static setLanguage(lang: TLanguage): void {
    this.setState({ lang });
    StorageManager.saveLanguage(lang);
  }

  /**
   * Toggle language
   */
  static toggleLanguage(): TLanguage {
    const newLang = this.state.lang === 'zh' ? 'en' : 'zh';
    this.setLanguage(newLang);
    return newLang;
  }

  /**
   * Get split mode
   */
  static getSplitMode(): TSplitMode {
    return this.state.splitMode;
  }

  /**
   * Set split mode
   */
  static setSplitMode(mode: TSplitMode): void {
    this.setState({ splitMode: mode });
  }

  /**
   * Save current state to localStorage
   * @param inputs - Input values to save alongside state
   */
  static saveToStorage(inputs: Record<string, string> = {}): void {
    StorageManager.saveState(this.state, inputs);
  }

  /**
   * Load state from localStorage (already done in initialize)
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
  }

  /**
   * Clear all persisted data
   */
  static clearStorage(): void {
    StorageManager.clear();
    this.reset();
  }
}

export default StateManager;
