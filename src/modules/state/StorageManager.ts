/**
 * StorageManager Module
 * Handles persisting and retrieving data from localStorage
 */

import { STORAGE_KEY, THEME_STORAGE_KEY, LANG_STORAGE_KEY } from '../../constants/index.js';
import type { IPaceState } from '../../types/index';

class MemoryStorage {
  private data: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.data[key] !== undefined ? this.data[key] : null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = value.toString();
  }
  removeItem(key: string): void {
    delete this.data[key];
  }
  clear(): void {
    this.data = {};
  }
}

let storage: any;
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('__storage_test__', '1');
    localStorage.removeItem('__storage_test__');
    storage = localStorage;
  } else {
    storage = new MemoryStorage();
  }
} catch {
  storage = new MemoryStorage();
}

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
      storage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save state to storage:', error);
    }
  }

  /**
   * Load application state and inputs from storage
   * @returns { state, inputs } or null if not found
   */
  static loadState(): { state: Partial<IPaceState>; inputs: Record<string, string> } | null {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (!saved) return null;

      const data = JSON.parse(saved);
      if (!data || typeof data !== 'object') return null;

      return {
        state: typeof data.state === 'object' && data.state !== null ? data.state : {},
        inputs: typeof data.inputs === 'object' && data.inputs !== null ? data.inputs : {}
      };
    } catch (error) {
      console.error('Failed to load state from storage:', error);
      return null;
    }
  }

  /**
   * Save theme preference
   * @param theme - Theme to save ('light' | 'dark')
   */
  static saveTheme(theme: 'light' | 'dark'): void {
    try {
      storage.setItem(THEME_STORAGE_KEY, theme);
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
      const theme = storage.getItem(THEME_STORAGE_KEY);
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
      storage.setItem(LANG_STORAGE_KEY, lang);
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
      const lang = storage.getItem(LANG_STORAGE_KEY);
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
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(THEME_STORAGE_KEY);
      storage.removeItem(LANG_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  /**
   * Get raw value from storage
   * @param key - Storage key
   * @returns Value or null
   */
  static get(key: string): string | null {
    try {
      return storage.getItem(key);
    } catch (error) {
      console.error(`Failed to get item '${key}' from storage:`, error);
      return null;
    }
  }

  /**
   * Set raw value in storage
   * @param key - Storage key
   * @param value - Value to store
   */
  static set(key: string, value: string): void {
    try {
      storage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to set item '${key}' in storage:`, error);
    }
  }
}

export default StorageManager;
