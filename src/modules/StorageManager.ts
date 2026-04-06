/**
 * StorageManager Module
 * Handles persisting and retrieving data from localStorage
 */

import { STORAGE_KEY, THEME_STORAGE_KEY, LANG_STORAGE_KEY } from '../constants/index.js';
import type { IPaceState } from '../types/index';

export class StorageManager {
  /**
   * Save complete application state and inputs
   * @param state - Application state to save
   * @param inputs - Input values to save
   */
  static saveState(state: IPaceState, inputs: Record<string, string>): void {
    try {
      const dataToSave = {
        state,
        inputs
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Load application state and inputs from localStorage
   * @returns { state, inputs } or null if not found
   */
  static loadState(): { state: Partial<IPaceState>; inputs: Record<string, string> } | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const data = JSON.parse(saved);
      return {
        state: data.state || {},
        inputs: data.inputs || {}
      };
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return null;
    }
  }

  /**
   * Save theme preference
   * @param theme - Theme to save ('light' | 'dark')
   */
  static saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }

  /**
   * Load theme preference
   * @returns Theme or null if not found
   */
  static loadTheme(): 'light' | 'dark' | null {
    try {
      const theme = localStorage.getItem(THEME_STORAGE_KEY);
      if (theme === 'light' || theme === 'dark') {
        return theme;
      }
      return null;
    } catch (error) {
      console.error('Failed to load theme:', error);
      return null;
    }
  }

  /**
   * Save language preference
   * @param lang - Language to save ('zh' | 'en')
   */
  static saveLanguage(lang: 'zh' | 'en'): void {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }

  /**
   * Load language preference
   * @returns Language or null if not found
   */
  static loadLanguage(): 'zh' | 'en' | null {
    try {
      const lang = localStorage.getItem(LANG_STORAGE_KEY);
      if (lang === 'zh' || lang === 'en') {
        return lang;
      }
      return null;
    } catch (error) {
      console.error('Failed to load language:', error);
      return null;
    }
  }

  /**
   * Clear all stored data
   */
  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(THEME_STORAGE_KEY);
      localStorage.removeItem(LANG_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get raw value from localStorage
   * @param key - Storage key
   * @returns Value or null
   */
  static get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item '${key}' from localStorage:`, error);
      return null;
    }
  }

  /**
   * Set raw value in localStorage
   * @param key - Storage key
   * @param value - Value to store
   */
  static set(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item '${key}' in localStorage:`, error);
    }
  }
}

export default StorageManager;
