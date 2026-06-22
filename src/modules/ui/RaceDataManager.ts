import type { IRaceEvent } from '../../types/index';

const CACHE_KEY = 'pace_calc_race_data_cache';
const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

interface ICacheData {
  timestamp: number;
  data: IRaceEvent[];
}

function readCache(): ICacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as Partial<ICacheData>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.timestamp !== 'number' || !Array.isArray(parsed.data)) return null;

    return {
      timestamp: parsed.timestamp,
      data: parsed.data.filter((item): item is IRaceEvent => {
        return !!item && typeof item.id === 'string';
      })
    };
  } catch {
    return null;
  }
}

function writeCache(data: IRaceEvent[]): void {
  const cacheData: ICacheData = {
    timestamp: Date.now(),
    data
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
}

export class RaceDataManager {
  private static apiBaseUrl: string = '';
  private static races: IRaceEvent[] = [];

  static setApiUrl(url: string) {
    this.apiBaseUrl = url;
  }

  static getApiUrl(): string {
    return this.apiBaseUrl;
  }

  static getRaces(): IRaceEvent[] {
    return this.races;
  }

  static getRaceById(id: string): IRaceEvent | undefined {
    return this.races.find((r) => r.id === id);
  }

  /**
   * Fetch races from GAS API, utilizing localStorage cache
   */
  static async fetchRaces(forceRefresh = false): Promise<IRaceEvent[]> {
    if (!this.apiBaseUrl) return [];

    try {
      if (!forceRefresh) {
        const cached = readCache();
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          this.races = cached.data;
          return this.races;
        }
      }

      // Abort the request if it hangs so we fall back to cache instead of
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

      const data: Partial<IRaceEvent>[] = await response.json();
      this.races = data.map((item) => ({
        id: item.id || '',
        date: item.date || '',
        name: item.name || '',
        location: item.location || '',
        registrationLink: item.registrationLink || '',
        stravaFull: item.stravaFull || '',
        stravaHalf: item.stravaHalf || '',
        gpxFull: item.gpxFull || '',
        gpxHalf: item.gpxHalf || ''
      }));

      writeCache(this.races);

      return this.races;
    } catch (err) {
      console.warn('Failed to fetch race data:', err);
      // Fallback to cache if available even if expired, when offline
      const cached = readCache();
      if (cached) {
        this.races = cached.data;
        return this.races;
      }
      return [];
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
