import test from 'node:test';
import assert from 'node:assert/strict';

import TurnstileWidget from '../src/modules/ui/TurnstileWidget.js';

// No site key is injected under tsc/tests (__TURNSTILE_SITE_KEY__ → ''), so the
// widget is disabled and every method must be a safe no-op — the app and its
// tests run unchanged when Turnstile isn't configured.
test('TurnstileWidget is a no-op when no site key is configured', () => {
  assert.equal(TurnstileWidget.isEnabled(), false);
  assert.equal(TurnstileWidget.getToken(), '');
  assert.doesNotThrow(() => TurnstileWidget.reset());
  assert.doesNotThrow(() => TurnstileWidget.init()); // does not load any external script
});
