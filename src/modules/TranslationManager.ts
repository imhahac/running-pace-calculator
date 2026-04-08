/**
 * TranslationManager Module
 * Handles dynamic language switching and translation lookups.
 * Uses StateManager as the single source of truth for language state.
 */

import { TRANSLATIONS } from '../constants/index.js';
import StateManager from './StateManager.js';
import type { TLanguage } from '../types/index';

export class TranslationManager {
  /**
   * Initialize translation system
   * @param lang - Language to initialize with (defaults to state language)
   */
  static initialize(lang?: TLanguage): void {
    if (lang) {
      StateManager.setLanguage(lang);
    }
    // Otherwise StateManager already loaded lang from localStorage in its own initialize()
  }

  /**
   * Get translation for a key
   * @param key - Translation key
   * @param lang - Optional language override
   * @returns Translated string or key if not found
   */
  static get(key: string, lang?: TLanguage): string {
    const language = lang ?? StateManager.getLanguage();
    const dict = TRANSLATIONS[language];
    return dict[key] || key;
  }

  /**
   * Get current language
   */
  static getCurrentLanguage(): TLanguage {
    return StateManager.getLanguage();
  }

  /**
   * Set current language
   * @param lang - Language to set
   */
  static setLanguage(lang: TLanguage): void {
    StateManager.setLanguage(lang);
  }

  /**
   * Toggle between zh and en
   * @returns New language
   */
  static toggleLanguage(): TLanguage {
    return StateManager.toggleLanguage();
  }

  /**
   * Update all DOM elements with data-i18n attribute
   */
  static updateDOMTranslations(): void {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = this.get(key);
        if (translated !== key) {
          el.textContent = translated;
        }
      }
    });
  }

  /**
   * Get all translations for current language
   * @returns Translation dictionary
   */
  static getAll(): Record<string, string> {
    return { ...TRANSLATIONS[StateManager.getLanguage()] };
  }

  /**
   * Check if a translation key exists
   * @param key - Key to check
   * @param lang - Optional language override
   * @returns true if key exists
   */
  static has(key: string, lang?: TLanguage): boolean {
    const language = lang ?? StateManager.getLanguage();
    return key in TRANSLATIONS[language];
  }

  /**
   * Get multiple translations at once
   * @param keys - Array of keys
   * @returns Record of translations
   */
  static getMultiple(keys: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    keys.forEach((key) => {
      result[key] = this.get(key);
    });
    return result;
  }
}

export default TranslationManager;
