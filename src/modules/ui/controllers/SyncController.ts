/**
 * SyncController
 * Drives magic-link login + per-user cloud sync from the Settings panel:
 *  - send magic link, handle the ?login=… redirect, show signed-in state;
 *  - on login, PULL the saved blob and apply tool inputs + theme/lang;
 *  - on local changes, debounced PUSH of tool inputs + preferences.
 * Everything degrades to a no-op when no backend URL is set or not logged in.
 */

import BackendClient from '../../state/BackendClient.js';
import FormPersistence, { TOOL_INPUT_IDS } from '../../state/FormPersistence.js';
import StateManager from '../../state/StateManager.js';
import StorageManager from '../../state/StorageManager.js';
import TranslationManager from '../../state/TranslationManager.js';
import RaceLogStore from '../../state/RaceLogStore.js';
import RaceLog, { type IRaceEntry } from '../../core/RaceLog.js';
import TurnstileWidget from '../TurnstileWidget.js';
import LanguageController from './LanguageController.js';
import FitnessTrendController from './FitnessTrendController.js';

// localStorage flag: a push failed (offline) and needs resending on reconnect.
const PENDING_KEY = 'rpc_pending_sync';

export class SyncController {
  private static pushTimer: ReturnType<typeof setTimeout> | null = null;

  static async initialize(): Promise<void> {
    this.wireUi();
    TurnstileWidget.init();
    await this.handleMagicLinkRedirect();
    this.updateAuthUI();
    if (BackendClient.isLoggedIn()) await this.pull();
    this.bindPushTriggers();
    // Resend any change made while offline: now (if back online) and on reconnect.
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void this.flushPending());
    }
    void this.flushPending();
  }

  private static wireUi(): void {
    document.getElementById('auth-login-btn')?.addEventListener('click', () => void this.onLogin());
    document
      .getElementById('auth-logout-btn')
      ?.addEventListener('click', () => void this.onLogout());
  }

  private static status(key: string): void {
    const el = document.getElementById('auth-status');
    if (el) el.textContent = TranslationManager.get(key);
  }

  private static async onLogin(): Promise<void> {
    const email = (
      document.getElementById('auth-email-input') as HTMLInputElement | null
    )?.value.trim();
    if (!email) return;
    if (!BackendClient.isConfigured()) {
      this.status('auth_need_backend');
      return;
    }
    let token: string | undefined;
    if (TurnstileWidget.isEnabled()) {
      token = TurnstileWidget.getToken();
      if (!token) {
        this.status('auth_turnstile_required');
        return;
      }
    }
    this.status('auth_sending');
    const ok = await BackendClient.requestMagicLink(email, token);
    if (TurnstileWidget.isEnabled()) TurnstileWidget.reset(); // tokens are single-use
    this.status(ok ? 'auth_link_sent' : 'auth_error');
  }

  private static async onLogout(): Promise<void> {
    await BackendClient.logout();
    // Drop any unsent snapshot so it isn't later pushed into another account.
    StorageManager.remove(PENDING_KEY);
    this.updateAuthUI();
    this.status('auth_logged_out_msg');
  }

  private static async handleMagicLinkRedirect(): Promise<void> {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const token = url.searchParams.get('login');
    if (!token) return;
    this.status('auth_verifying');
    const res = await BackendClient.verify(token);
    url.searchParams.delete('login');
    window.history.replaceState({}, '', url.toString());
    this.status(res ? 'auth_signed_in' : 'auth_error');
  }

  static updateAuthUI(): void {
    const loggedIn = BackendClient.isLoggedIn();
    const out = document.getElementById('auth-logged-out');
    const inn = document.getElementById('auth-logged-in');
    const emailEl = document.getElementById('auth-email-display');
    if (out) out.style.display = loggedIn ? 'none' : 'block';
    if (inn) inn.style.display = loggedIn ? 'block' : 'none';
    if (emailEl) emailEl.textContent = BackendClient.getEmail() || '';
  }

  private static async pull(): Promise<void> {
    const data = await BackendClient.getData();
    if (!data) {
      this.updateAuthUI();
      return;
    }

    const toolInputs = data.toolInputs as Record<string, string> | undefined;
    const hasServerData = !!toolInputs && Object.keys(toolInputs).length > 0;

    // First login with an empty server → seed it from this device's local data
    // (so logging in never wipes existing local inputs).
    if (!hasServerData) {
      await BackendClient.putData(this.collect());
      this.updateAuthUI();
      this.status('auth_synced');
      return;
    }

    // Otherwise the server is the source of truth across devices.
    FormPersistence.apply(toolInputs, true); // dispatch → recompute + autosave

    // The race log is append-only: UNION local + server (never overwrite) so a
    // result logged on another device is preserved, then re-render the trend.
    const serverLog = Array.isArray(data.raceLog) ? (data.raceLog as IRaceEntry[]) : [];
    RaceLogStore.replace(RaceLog.merge(RaceLogStore.all(), serverLog));
    FitnessTrendController.calculate();

    const prefs = data.prefs as { theme?: string; lang?: string } | undefined;
    if (prefs) {
      if (prefs.theme === 'dark' || prefs.theme === 'light') StateManager.setTheme(prefs.theme);
      if (prefs.lang === 'zh' || prefs.lang === 'en') {
        StateManager.setLanguage(prefs.lang);
        LanguageController.applyLanguage();
      }
    }
    this.updateAuthUI();
    this.status('auth_synced');
  }

  private static collect(): Record<string, unknown> {
    return {
      // includeEmpty: true so clearing a field propagates to other devices.
      toolInputs: FormPersistence.snapshot(TOOL_INPUT_IDS, true),
      prefs: { theme: StateManager.getTheme(), lang: StateManager.getLanguage() },
      raceLog: RaceLogStore.all(),
      updatedAt: Date.now()
    };
  }

  static schedulePush(): void {
    if (!BackendClient.isLoggedIn()) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => {
      void (async () => {
        const ok = await BackendClient.putData(this.collect());
        // Offline / failed → remember so we resend on reconnect (last-write-wins).
        if (ok) StorageManager.remove(PENDING_KEY);
        else StorageManager.set(PENDING_KEY, '1');
      })();
    }, 1200);
  }

  /** Resend the latest local snapshot if a previous push failed while offline. */
  static async flushPending(): Promise<void> {
    if (!BackendClient.isLoggedIn() || StorageManager.get(PENDING_KEY) !== '1') return;
    const ok = await BackendClient.putData(this.collect());
    if (ok) StorageManager.remove(PENDING_KEY);
  }

  private static bindPushTriggers(): void {
    TOOL_INPUT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => this.schedulePush());
      el.addEventListener('change', () => this.schedulePush());
    });
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.schedulePush());
    document.getElementById('lang-toggle')?.addEventListener('click', () => this.schedulePush());
  }
}

export default SyncController;
