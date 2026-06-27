/**
 * AllRacesController
 * Dedicated "Races" tab that lists every race the backend returns
 * (RaceDataManager), with a name/location text filter. Read-only; the data is
 * whatever `GET /api/races` returned (cached). External-sourced strings are
 * escaped before being inserted as HTML.
 */

import RaceDataManager from '../RaceDataManager.js';
import TranslationManager from '../../state/TranslationManager.js';

const esc = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );

export class AllRacesController {
  static initialize(): void {
    document.getElementById('all-races-search')?.addEventListener('input', () => this.calculate());
    // Make sure races are loaded (cached/cheap), then render.
    void RaceDataManager.fetchRaces().then(() => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const listEl = document.getElementById('all-races-list');
    if (!listEl) return;
    const t = TranslationManager.getDict();

    const searchEl = document.getElementById('all-races-search') as HTMLInputElement | null;
    if (searchEl) searchEl.placeholder = t.allraces_search_ph || '';

    const countEl = document.getElementById('all-races-count');
    const emptyEl = document.getElementById('all-races-empty');

    const all = RaceDataManager.getRaces()
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!all.length) {
      listEl.innerHTML = '';
      if (countEl) countEl.textContent = '';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    const q = (searchEl?.value || '').trim().toLowerCase();
    const races = q ? all.filter((r) => `${r.name} ${r.location}`.toLowerCase().includes(q)) : all;

    if (countEl) {
      countEl.textContent = TranslationManager.format('allraces_count', { n: races.length });
    }

    listEl.innerHTML = races
      .map((r) => {
        const loc = `<span>${esc(r.location || '')}</span>`;
        const link = r.registrationLink
          ? `<a href="${esc(r.registrationLink)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(r.name)}">↗</a>`
          : '';
        return (
          `<div class="fuel-row"><span class="mono-text">${esc(r.date)}</span>` +
          `<span>${esc(r.name)}</span>${loc}<span>${link}</span></div>`
        );
      })
      .join('');
  }
}

export default AllRacesController;
