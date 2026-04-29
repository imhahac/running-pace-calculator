import { TRANSLATIONS, I18N_RULES } from '../constants/index.js';
import StateManager from './StateManager.js';
export class TranslationManager {
    static initialize(lang) {
        if (lang) {
            StateManager.setLanguage(lang);
        }
    }
    static get(key, lang) {
        const language = lang ?? StateManager.getLanguage();
        const dict = TRANSLATIONS[language];
        return dict[key] || key;
    }
    static getCurrentLanguage() {
        return StateManager.getLanguage();
    }
    static setLanguage(lang) {
        StateManager.setLanguage(lang);
    }
    static toggleLanguage() {
        return StateManager.toggleLanguage();
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
        return { ...TRANSLATIONS[StateManager.getLanguage()] };
    }
    static has(key, lang) {
        const language = lang ?? StateManager.getLanguage();
        return key in TRANSLATIONS[language];
    }
    static getMultiple(keys) {
        const result = {};
        keys.forEach((key) => {
            result[key] = this.get(key);
        });
        return result;
    }
    static getUnitLabel(domain, unit) {
        const lang = StateManager.getLanguage();
        return I18N_RULES[lang].units[domain][unit];
    }
    static getOptionLabel(category, key) {
        const lang = StateManager.getLanguage();
        return I18N_RULES[lang].options[category][key] || key;
    }
    static getTrainingFocusLabel(focus) {
        const lang = StateManager.getLanguage();
        return I18N_RULES[lang].trainingFocus[focus];
    }
    static getWorkoutLabel(kind) {
        const lang = StateManager.getLanguage();
        return I18N_RULES[lang].workouts[kind];
    }
}
export default TranslationManager;
