import test from 'node:test';
import assert from 'node:assert/strict';

import StateManager from '../src/modules/state/StateManager.js';
import ThemeController from '../src/modules/ui/ThemeController.js';

test('ThemeController reinitializes without stacking subscriptions', () => {
  const w = globalThis as any;
  const originalDocument = w.document;
  const originalApplyTheme = ThemeController.applyTheme;

  const themeIcon = { textContent: '' };
  const documentElement = {
    setAttribute: (_key: string, value: string) => {
      documentElement.lastValue = value;
    },
    lastValue: ''
  };

  w.document = {
    getElementById: (id: string) => (id === 'theme-icon-text' ? themeIcon : null),
    documentElement
  };

  StateManager.setTheme('light');

  let applyCount = 0;
  ThemeController.applyTheme = function patchedApplyTheme(this: typeof ThemeController): void {
    applyCount += 1;
    return originalApplyTheme.call(this);
  } as typeof ThemeController.applyTheme;

  ThemeController.initialize();
  ThemeController.initialize();
  StateManager.toggleTheme();

  assert.equal(applyCount, 3);
  assert.equal(themeIcon.textContent, '🌙');
  assert.equal(documentElement.lastValue, 'dark');

  ThemeController.applyTheme = originalApplyTheme;
  w.document = originalDocument;
});
