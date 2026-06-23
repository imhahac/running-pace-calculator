/**
 * VersionController
 * Shows the running app version (semantic version + content hash) in the footer
 * and actively checks whether a newer build has been deployed by re-fetching
 * the freshly-deployed `build-info.js` and comparing its hash. When a newer
 * build is found it reuses the existing service-worker update flow (surface the
 * update bar + ask the registration to re-check) wired in index.html.
 */

import TranslationManager from '../../state/TranslationManager.js';

type TUpdateState = 'unknown' | 'latest' | 'stale';

type BuildGlobals = { __APP_VERSION__?: string; __BUILD_HASH__?: string };

export class VersionController {
  private static state: TUpdateState = 'unknown';

  static initialize(): void {
    this.renderVersion();
    this.renderStatus();
    void this.checkForUpdate();
  }

  /** Re-render the already-determined status text in the current language. */
  static calculate(): void {
    this.renderStatus();
  }

  private static globals(): BuildGlobals {
    return window as unknown as BuildGlobals;
  }

  private static renderVersion(): void {
    const el = document.getElementById('app-version');
    if (!el) return;
    const { __APP_VERSION__: version, __BUILD_HASH__: hash } = this.globals();
    const parts: string[] = [];
    if (version) parts.push(`v${version}`);
    if (hash) parts.push(`(${hash.slice(0, 8)})`);
    el.textContent = parts.join(' ') || '—';
  }

  private static renderStatus(): void {
    const el = document.getElementById('app-version-status');
    if (!el) return;

    if (this.state === 'latest') {
      el.textContent = TranslationManager.get('version_latest');
      el.classList.remove('is-stale');
      el.style.cursor = '';
      el.onclick = null;
    } else if (this.state === 'stale') {
      el.textContent = TranslationManager.get('version_update');
      el.classList.add('is-stale');
      el.style.cursor = 'pointer';
      el.onclick = () => this.applyUpdate();
    } else {
      el.textContent = '';
      el.classList.remove('is-stale');
      el.onclick = null;
    }
  }

  private static async checkForUpdate(): Promise<void> {
    const current = this.globals().__BUILD_HASH__;
    if (!current) return; // no local stamp → cannot compare; leave status blank

    try {
      // Cache-busting query bypasses BOTH the HTTP cache and the service-worker
      // cache (which is keyed by full URL incl. query), so we always read the
      // hash of the build currently deployed on the server.
      const resp = await fetch(`assets/js/build-info.js?ts=${Date.now()}`, { cache: 'no-store' });
      if (!resp.ok) return;
      const text = await resp.text();
      const match = text.match(/__BUILD_HASH__\s*=\s*'([^']+)'/);
      if (!match) return;
      this.state = match[1] === current ? 'latest' : 'stale';
      this.renderStatus();
    } catch {
      // Offline / fetch blocked — keep status unknown (blank), no nag.
    }
  }

  private static applyUpdate(): void {
    // Reuse the existing SW update path: reveal the update bar and ask the
    // registration to re-check. The bar's button posts SKIP_WAITING and the
    // controllerchange handler (index.html) reloads the page.
    const bar = document.getElementById('sw-update-bar');
    if (bar) bar.classList.remove('hidden-update');

    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) void reg.update();
      });
    } else {
      window.location.reload();
    }
  }
}

export default VersionController;
