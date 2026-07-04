import type { IRaceEvent } from '../../types/index';

const CACHE_KEY = 'pace_calc_race_data_cache';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — fast path; a background revalidate keeps it fresh
const REVALIDATE_MIN_AGE_MS = 10 * 60 * 1000; // don't background-refresh a cache younger than this

interface ICacheData {
  timestamp: number;
  data: IRaceEvent[];
  updatedAt?: string;
  url?: string; // backend URL the data came from — guards against a settings change
}

function readCache(url: string): ICacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as Partial<ICacheData>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.timestamp !== 'number' || !Array.isArray(parsed.data)) return null;
    // Ignore a cache written for a different backend URL (e.g. changed in settings).
    if (parsed.url && parsed.url !== url) return null;

    return {
      timestamp: parsed.timestamp,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
      data: parsed.data.filter((item): item is IRaceEvent => {
        return !!item && typeof item.id === 'string';
      })
    };
  } catch {
    return null;
  }
}

function writeCache(url: string, data: IRaceEvent[], updatedAt: string): void {
  const cacheData: ICacheData = { timestamp: Date.now(), updatedAt, data, url };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

export class RaceDataManager {
  private static apiBaseUrl: string = '';
  private static races: IRaceEvent[] = [];
  private static updatedAt: string = '';
  private static revalidating = false;
  private static inFlight: Promise<void> | null = null;

  static setApiUrl(url: string) {
    this.apiBaseUrl = url;
  }

  static getApiUrl(): string {
    return this.apiBaseUrl;
  }

  /** ISO timestamp of the backend's last race refresh (from X-Races-Updated), or ''. */
  static getUpdatedAt(): string {
    return this.updatedAt;
  }

  static getRaces(): IRaceEvent[] {
    return this.races;
  }

  static getRaceById(id: string): IRaceEvent | undefined {
    return this.races.find((r) => r.id === id);
  }

  /**
   * Fetch races (stale-while-revalidate). A fresh cache paints instantly and a
   * background revalidate then refreshes it — so a stale cache can never persist
   * across loads. `forceRefresh` skips the cache and awaits the network.
   */
  static async fetchRaces(forceRefresh = false): Promise<IRaceEvent[]> {
    if (!this.apiBaseUrl) return [];

    if (!forceRefresh) {
      const cached = readCache(this.apiBaseUrl);
      if (cached) {
        this.races = cached.data;
        this.updatedAt = cached.updatedAt || '';
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
          // Skip a needless refresh for a very fresh cache; older ones revalidate
          // in the background and emit 'races-updated' on change.
          if (Date.now() - cached.timestamp > REVALIDATE_MIN_AGE_MS) void this.revalidate();
          return this.races;
        }
      }
    }

    try {
      await this.fetchFromNetwork();
      return this.races;
    } catch (err) {
      console.warn('Failed to fetch race data:', err);
      // Fallback to cache if available even if expired, when offline.
      const cached = readCache(this.apiBaseUrl);
      if (cached) {
        this.races = cached.data;
        this.updatedAt = cached.updatedAt || '';
        return this.races;
      }
      return [];
    }
  }

  /**
   * Live fetch → normalise → update state + cache. Throws on network/HTTP error.
   * Concurrent callers share one in-flight request (dedup), so the two controllers
   * that both load races on startup don't fire duplicate GETs.
   */
  private static fetchFromNetwork(): Promise<void> {
    if (this.inFlight) return this.inFlight;
    this.inFlight = (async () => {
      // Abort if the request hangs so callers fall back to cache instead of
      // leaving the UI waiting on a stalled network indefinitely.
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      let response: Response;
      try {
        response = await fetch(this.apiBaseUrl, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) throw new Error('API response error');

      const json: unknown = await response.json();
      if (!Array.isArray(json)) throw new Error('unexpected races payload');
      const data = json as Partial<IRaceEvent>[];
      this.races = data.map((item) => ({
        // Crawler-sourced races carry no id (the Worker emits id: ''); derive a
        // stable one from date+name so the selector's getRaceById works and the
        // value survives cache + refreshes (GAS already supplies "race_N").
        id: item.id || `${item.date || ''}_${item.name || ''}`,
        date: item.date || '',
        name: item.name || '',
        location: item.location || '',
        registrationLink: item.registrationLink || '',
        stravaFull: item.stravaFull || '',
        stravaHalf: item.stravaHalf || '',
        gpxFull: item.gpxFull || '',
        gpxHalf: item.gpxHalf || '',
        distances: item.distances || '',
        regClose: item.regClose || '',
        source: item.source || ''
      }));
      this.updatedAt = response.headers.get('X-Races-Updated') || '';
      writeCache(this.apiBaseUrl, this.races, this.updatedAt);
    })().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  /**
   * Background refresh for the stale-while-revalidate path. Emits a
   * `races-updated` window event when the backend's timestamp actually changed,
   * so views re-render with fresh data without the user reloading.
   */
  private static async revalidate(): Promise<void> {
    if (this.revalidating) return;
    this.revalidating = true;
    const before = this.updatedAt;
    try {
      await this.fetchFromNetwork();
      if (this.updatedAt !== before && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('races-updated'));
      }
    } catch {
      /* keep showing cache; the next load retries */
    } finally {
      this.revalidating = false;
    }
  }

  /**
   * Convert standard Strava route URL to an embed iframe URL
   * e.g., https://www.strava.com/routes/1234567 -> https://www.strava.com/routes/1234567/export_embed
   */
  static getStravaEmbedUrl(rawUrl: string): string {
    if (!rawUrl) return '';
    if (rawUrl.includes('/export_embed')) return rawUrl;

    // Check if it's a valid strava route URL
    const match = rawUrl.match(/strava\.com\/routes\/(\d+)/);
    if (match && match[1]) {
      return `https://www.strava.com/routes/${match[1]}/export_embed`;
    }
    return '';
  }
}

export default RaceDataManager;
