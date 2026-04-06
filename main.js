import StateManager from './modules/StateManager';
import TranslationManager from './modules/TranslationManager';
import UIController from './modules/UIController';
import { initializeDOMElements } from './constants/domElements';
function initializeApp() {
    try {
        StateManager.initialize();
        TranslationManager.initialize();
        initializeDOMElements();
        UIController.initialize();
        UIController.bindEvents();
        console.log('Running Pace Calculator initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize application:', error);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
}
else {
    initializeApp();
}
if (typeof window !== 'undefined') {
    window.__APP__ = {
        StateManager,
        TranslationManager,
        UIController
    };
}
