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

test('fetchRaces derives a stable id from date+name when the source has none', async () => {
  // Worker-crawled races carry id: '' — without a derived id every dropdown
  // option shares value "" and getRaceById('') returns the first race.
  const w = globalThis as unknown as Record<string, unknown>;
  const originalFetch = w.fetch;
  const originalLocalStorage = w.localStorage;
  w.localStorage = createMemoryStorage();
  RaceDataManager.setApiUrl('https://example.com/races');

  w.fetch = async () => ({
    ok: true,
    headers: { get: () => '' },
    json: async () => [
      { id: '', date: '2026-10-18', name: 'City Run', location: 'Taipei' },
      { id: '', date: '2026-11-01', name: 'Hill Race', location: 'Hualien' }
    ]
  });

  const races = await RaceDataManager.fetchRaces(true);
  assert.equal(races[0].id, '2026-10-18_City Run');
  assert.equal(races[1].id, '2026-11-01_Hill Race');
  // getRaceById resolves each distinct race (not always the first).
  assert.equal(RaceDataManager.getRaceById('2026-11-01_Hill Race')?.name, 'Hill Race');

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

test('fetchRaces serves fresh cache immediately then revalidates in background', async () => {
  const w = globalThis as unknown as Record<string, unknown>;
  const originalFetch = w.fetch;
  const originalLocalStorage = w.localStorage;
  w.localStorage = createMemoryStorage();
  RaceDataManager.setApiUrl('https://example.com/races');

  // Seed a fresh cache via a forced fetch (old data + old timestamp).
  let updated = '2026-06-01T00:00:00Z';
  let payload = [{ id: 'a', date: '2026-06-01', name: 'Old Race' }];
  w.fetch = async () => ({ ok: true, headers: { get: () => updated }, json: async () => payload });
  await RaceDataManager.fetchRaces(true);
  assert.equal(RaceDataManager.getUpdatedAt(), '2026-06-01T00:00:00Z');

  // Backend now has newer data. A non-forced fetch returns the cached (stale)
  // data immediately, then the background revalidate swaps in the fresh data.
  updated = '2026-07-02T18:00:00Z';
  payload = [{ id: 'b', date: '2026-07-02', name: 'New Race' }];
  const served = await RaceDataManager.fetchRaces(false);
  assert.equal(served[0].name, 'Old Race'); // stale-while-revalidate: instant cache

  // Let the background revalidate finish.
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(RaceDataManager.getUpdatedAt(), '2026-07-02T18:00:00Z');
  assert.equal(RaceDataManager.getRaces()[0].name, 'New Race');

  w.fetch = originalFetch;
  w.localStorage = originalLocalStorage;
});
