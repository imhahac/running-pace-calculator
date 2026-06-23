/**
 * BackendClient
 * Thin client for the Cloudflare Worker backend (magic-link auth + per-user
 * data sync). Session token + email live in localStorage; the base URL comes
 * from StateManager (the "後端 URL (Worker)" setting). All calls are guarded
 * and resolve to null/false on failure so the UI degrades gracefully.
 */

import StateManager from './StateManager.js';

const SESSION_KEY = 'rpc_session';
const EMAIL_KEY = 'rpc_session_email';

function ls(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export class BackendClient {
  static baseUrl(): string {
    return StateManager.getBackendUrl().replace(/\/+$/, '');
  }

  static isConfigured(): boolean {
    return this.baseUrl().length > 0;
  }

  /** Races endpoint on the Worker, or '' when no backend URL is set. */
  static racesUrl(): string {
    return this.isConfigured() ? `${this.baseUrl()}/api/races` : '';
  }

  static getSession(): string | null {
    return ls()?.getItem(SESSION_KEY) || null;
  }

  static getEmail(): string | null {
    return ls()?.getItem(EMAIL_KEY) || null;
  }

  static isLoggedIn(): boolean {
    return !!this.getSession();
  }

  private static setSession(token: string, email: string): void {
    const store = ls();
    if (!store) return;
    store.setItem(SESSION_KEY, token);
    store.setItem(EMAIL_KEY, email);
  }

  private static clearSession(): void {
    const store = ls();
    if (!store) return;
    store.removeItem(SESSION_KEY);
    store.removeItem(EMAIL_KEY);
  }

  /** Request a magic-link email. Returns true if the request was accepted. */
  static async requestMagicLink(email: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const resp = await fetch(`${this.baseUrl()}/api/auth/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return resp.ok;
    } catch {
      return false;
    }
  }

  /** Exchange a magic token for a session. Stores it on success. */
  static async verify(token: string): Promise<{ email: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const resp = await fetch(
        `${this.baseUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`
      );
      if (!resp.ok) return null;
      const data = (await resp.json()) as { token?: string; email?: string };
      if (!data.token || !data.email) return null;
      this.setSession(data.token, data.email);
      return { email: data.email };
    } catch {
      return null;
    }
  }

  static async logout(): Promise<void> {
    const token = this.getSession();
    this.clearSession();
    if (!this.isConfigured() || !token) return;
    try {
      await fetch(`${this.baseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      /* best effort */
    }
  }

  /** Fetch the user's saved blob, or null if not logged in / failed. */
  static async getData(): Promise<Record<string, unknown> | null> {
    const token = this.getSession();
    if (!this.isConfigured() || !token) return null;
    try {
      const resp = await fetch(`${this.baseUrl()}/api/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.status === 401) {
        this.clearSession(); // stale session
        return null;
      }
      if (!resp.ok) return null;
      return (await resp.json()) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /** Persist the user's blob. Returns true on success. */
  static async putData(data: Record<string, unknown>): Promise<boolean> {
    const token = this.getSession();
    if (!this.isConfigured() || !token) return false;
    try {
      const resp = await fetch(`${this.baseUrl()}/api/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return resp.ok;
    } catch {
      return false;
    }
  }
}

export default BackendClient;
