/**
 * TranslationManager Module
 * Handles dynamic language switching and translation lookups
 */

import { TRANSLATIONS } from '../constants/index';
import StateManager from './StateManager';
import type { TLanguage } from '../types/index';

export class TranslationManager {
  private static currentLang: TLanguage = 'zh';

  /**
   * Initialize translation system
   * @param lang - Language to initialize with (defaults to state language)
   */
  static initialize(lang?: TLanguage): void {
    if (lang) {
      this.currentLang = lang;
    } else {
      this.currentLang = StateManager.getLanguage();
    }
  }

  /**
   * Get translation for a key
   * @param key - Translation key
   * @param lang - Optional language override
   * @returns Translated string or key if not found
   */
  static get(key: string, lang?: TLanguage): string {
    const language = lang || this.currentLang;
    const dict = TRANSLATIONS[language];
    return dict[key] || key;
  }

  /**
   * Get current language
   */
  static getCurrentLanguage(): TLanguage {
    return this.currentLang;
  }

  /**
   * Set current language
   * @param lang - Language to set
   */
  static setLanguage(lang: TLanguage): void {
    this.currentLang = lang;
    StateManager.setLanguage(lang);
  }

  /**
   * Toggle between zh and en
   * @returns New language
   */
  static toggleLanguage(): TLanguage {
    const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
    this.setLanguage(newLang);
    return newLang;
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
    return { ...TRANSLATIONS[this.currentLang] };
  }

  /**
   * Check if a translation key exists
   * @param key - Key to check
   * @param lang - Optional language override
   * @returns true if key exists
   */
  static has(key: string, lang?: TLanguage): boolean {
    const language = lang || this.currentLang;
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
