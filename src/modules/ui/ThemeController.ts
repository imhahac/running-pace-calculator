import StateManager from '../state/StateManager.js';
import StorageManager from '../state/StorageManager.js';

const THEME_COLORS: Record<'dark' | 'light', string> = {
  dark: '#0b0f1a',
  light: '#ffffff'
};

export class ThemeController {
  private static themeIconEl: HTMLElement | null = null;
  private static unsubscribe: (() => void) | null = null;

  /**
   * Initialize ThemeController
   */
  static initialize(): void {
    this.themeIconEl = document.getElementById('theme-icon-text');

    // Respect OS colour-scheme on first load when the user has no saved preference
    if (!StorageManager.loadTheme() && typeof window !== 'undefined' && window.matchMedia) {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      StateManager.setTheme(prefersLight ? 'light' : 'dark');
    }

    this.applyTheme();

    // 訂閱狀態變更
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = StateManager.subscribe(() => {
      this.applyTheme();
    });
  }

  /**
   * Toggle theme
   */
  static toggleTheme(): void {
    StateManager.toggleTheme();
  }

  /**
   * Apply theme to document
   */
  static applyTheme(): void {
    const theme = StateManager.getTheme();
    document.documentElement.setAttribute('data-theme', theme);
    if (this.themeIconEl) {
      this.themeIconEl.textContent = theme === 'dark' ? '🌙' : '☀️';
    }

    // Keep the PWA / browser UI colour in sync with the active theme
    if (typeof document.querySelector === 'function') {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.dark);
      }
    }
  }
}

export default ThemeController;
