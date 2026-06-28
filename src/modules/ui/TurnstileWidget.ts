/**
 * TurnstileWidget
 * Optional Cloudflare Turnstile on the magic-link login form. Active only when a
 * site key was injected at build time (INJECTED_TURNSTILE_SITE_KEY); otherwise
 * every method is a no-op and no external script is loaded — so the app and its
 * tests run unchanged without Turnstile configured.
 *
 * The Worker side verifies the token only when TURNSTILE_SECRET is set, so the
 * two halves enable together but each degrades gracefully on its own.
 */

import { INJECTED_TURNSTILE_SITE_KEY } from '../../constants/index.js';

interface TurnstileApi {
  render(el: string | HTMLElement, opts: { sitekey: string }): string;
  getResponse(id?: string): string | undefined;
  reset(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export class TurnstileWidget {
  private static widgetId: string | null = null;
  private static loading = false;

  /** True when a site key is configured (and thus verification is expected). */
  static isEnabled(): boolean {
    return INJECTED_TURNSTILE_SITE_KEY.length > 0;
  }

  /** Inject the Turnstile script once and render the widget into #auth-turnstile. */
  static init(): void {
    if (!this.isEnabled() || this.loading || this.widgetId !== null) return;
    if (typeof document === 'undefined') return;
    this.loading = true;

    const render = (): void => {
      // Clear the guard once we've attempted: on success widgetId blocks re-render;
      // on failure (no element / api not ready) a later init() can retry.
      this.loading = false;
      const el = document.getElementById('auth-turnstile');
      if (!el || !window.turnstile) return;
      this.widgetId = window.turnstile.render(el, { sitekey: INJECTED_TURNSTILE_SITE_KEY });
    };

    if (window.turnstile) {
      render();
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = render;
    script.onerror = () => {
      this.loading = false; // script blocked/failed → allow a future retry
    };
    document.head.appendChild(script);
  }

  /** Current token, or '' if not enabled / not yet solved. */
  static getToken(): string {
    if (!this.isEnabled() || !window.turnstile) return '';
    return window.turnstile.getResponse(this.widgetId ?? undefined) || '';
  }

  /** Reset the widget so a new token can be obtained (tokens are single-use). */
  static reset(): void {
    if (this.isEnabled() && window.turnstile) window.turnstile.reset(this.widgetId ?? undefined);
  }
}

export default TurnstileWidget;
