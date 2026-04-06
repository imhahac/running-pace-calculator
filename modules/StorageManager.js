import { STORAGE_KEY, THEME_STORAGE_KEY, LANG_STORAGE_KEY } from '../constants/index.js';
export class StorageManager {
    static saveState(state, inputs) {
        try {
            const dataToSave = {
                state,
                inputs
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        }
        catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }
    static loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved)
                return null;
            const data = JSON.parse(saved);
            return {
                state: data.state || {},
                inputs: data.inputs || {}
            };
        }
        catch (error) {
            console.error('Failed to load state from localStorage:', error);
            return null;
        }
    }
    static saveTheme(theme) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
        catch (error) {
            console.error('Failed to save theme:', error);
        }
    }
    static loadTheme() {
        try {
            const theme = localStorage.getItem(THEME_STORAGE_KEY);
            if (theme === 'light' || theme === 'dark') {
                return theme;
            }
            return null;
        }
        catch (error) {
            console.error('Failed to load theme:', error);
            return null;
        }
    }
    static saveLanguage(lang) {
        try {
            localStorage.setItem(LANG_STORAGE_KEY, lang);
        }
        catch (error) {
            console.error('Failed to save language:', error);
        }
    }
    static loadLanguage() {
        try {
            const lang = localStorage.getItem(LANG_STORAGE_KEY);
            if (lang === 'zh' || lang === 'en') {
                return lang;
            }
            return null;
        }
        catch (error) {
            console.error('Failed to load language:', error);
            return null;
        }
    }
    static clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(THEME_STORAGE_KEY);
            localStorage.removeItem(LANG_STORAGE_KEY);
        }
        catch (error) {
            console.error('Failed to clear localStorage:', error);
        }
    }
    static get(key) {
        try {
            return localStorage.getItem(key);
        }
        catch (error) {
            console.error(`Failed to get item '${key}' from localStorage:`, error);
            return null;
        }
    }
    static set(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch (error) {
            console.error(`Failed to set item '${key}' in localStorage:`, error);
        }
    }
}
export default StorageManager;
