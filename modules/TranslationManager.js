import { TRANSLATIONS } from '../constants/index.js';
import StateManager from './StateManager.js';
export class TranslationManager {
    static initialize(lang) {
        if (lang) {
            this.currentLang = lang;
        }
        else {
            this.currentLang = StateManager.getLanguage();
        }
    }
    static get(key, lang) {
        const language = lang || this.currentLang;
        const dict = TRANSLATIONS[language];
        return dict[key] || key;
    }
    static getCurrentLanguage() {
        return this.currentLang;
    }
    static setLanguage(lang) {
        this.currentLang = lang;
        StateManager.setLanguage(lang);
    }
    static toggleLanguage() {
        const newLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.setLanguage(newLang);
        return newLang;
    }
    static updateDOMTranslations() {
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
    static getAll() {
        return { ...TRANSLATIONS[this.currentLang] };
    }
    static has(key, lang) {
        const language = lang || this.currentLang;
        return key in TRANSLATIONS[language];
    }
    static getMultiple(keys) {
        const result = {};
        keys.forEach((key) => {
            result[key] = this.get(key);
        });
        return result;
    }
}
TranslationManager.currentLang = 'zh';
export default TranslationManager;
