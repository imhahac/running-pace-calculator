import test from 'node:test';
import assert from 'node:assert/strict';

import RaceDataManager from '../src/modules/ui/RaceDataManager.js';

function createMemoryStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      Object.keys(store).forEach((key) => delete store[key]);
    }
  };
}

test('fetchRaces ignores corrupted cache and still uses API data', async () => {
  const w = globalThis as unknown as Record<string, unknown>;
  const originalFetch = w.fetch;
  const originalLocalStorage = w.localStorage;
  w.localStorage = createMemoryStorage({ pace_calc_race_data_cache: 'not-json' });
  RaceDataManager.setApiUrl('https://example.com/races');

  w.fetch = async () => ({
    ok: true,
    headers: { get: () => '2026-10-01T09:00:00Z' },
    json: async () => [
      {
        id: 'race-1',
        date: '2026-10-18',
        name: 'City Run',
        location: 'Taipei',
        registrationLink: 'https://example.com/register',
        stravaFull: '',
        stravaHalf: ''
      }
    ]
  });

  const races = await RaceDataManager.fetchRaces(true);

  assert.equal(races.length, 1);
  assert.equal(races[0].id, 'race-1');
  assert.equal(RaceDataManager.getUpdatedAt(), '2026-10-01T09:00:00Z'); // X-Races-Updated header

  w.fetch = originalFetch;
  w.localStorage = originalLocalStorage;
});

test('fetchRaces returns empty list when cache is corrupted and api fails', async () => {
  const w = globalThis as unknown as Record<string, unknown>;
  const originalFetch = w.fetch;
  const originalLocalStorage = w.localStorage;
  w.localStorage = createMemoryStorage({ pace_calc_race_data_cache: 'not-json' });
  RaceDataManager.setApiUrl('https://example.com/races');

  w.fetch = async () => ({
    ok: false,
    json: async () => []
  });

  const races = await RaceDataManager.fetchRaces(true);

  assert.deepEqual(races, []);

  w.fetch = originalFetch;
  w.localStorage = originalLocalStorage;
});
