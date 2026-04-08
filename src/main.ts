/**
 * main.ts
 * Main entry point for the Running Pace Calculator application
 * Initializes all modules and starts the application
 */

import StateManager from './modules/StateManager.js';
import TranslationManager from './modules/TranslationManager.js';
import UIController from './modules/UIController.js';

/**
 * Initialize and start the application
 */
function initializeApp(): void {
  try {
    // Initialize state from localStorage
    StateManager.initialize();

    // Initialize translation system
    TranslationManager.initialize();

    // Initialize UI controller (internally initializes & caches DOM elements)
    UIController.initialize();

    // Bind all event listeners
    UIController.bindEvents();

    // Log successful initialization
    console.log('Running Pace Calculator initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Make modules globally available for debugging (optional)
if (typeof window !== 'undefined') {
  (window as any).__APP__ = {
    StateManager,
    TranslationManager,
    UIController
  };
}
