/**
 * AllRacesController
 * Dedicated "Races" tab: lists every race the backend returns (RaceDataManager)
 * with month, region and free-text filters, an "upcoming only" toggle, grouped
 * by month with weekday + countdown. Read-only; external-sourced strings are
 * escaped before being inserted as HTML.
 */

import RaceDataManager from '../RaceDataManager.js';
import TranslationManager from '../../state/TranslationManager.js';
import StateManager from '../../state/StateManager.js';
import {
  raceMatchesDistance,
  DISTANCE_CATEGORIES,
  type DistanceCategory
} from '../raceDistance.js';

const esc = (s: string): string =>
  String(s).replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;'
  );

// Taiwan counties/cities, used to derive a coarse region from a race location
// (biji gives a clean county; marathonsworld gives a full venue string).
const COUNTIES = [
  '臺北市',
  '台北市',
  '新北市',
  '桃園市',
  '臺中市',
  '台中市',
  '臺南市',
  '台南市',
  '高雄市',
  '基隆市',
  '新竹市',
  '新竹縣',
  '苗栗縣',
  '彰化縣',
  '南投縣',
  '雲林縣',
  '嘉義市',
  '嘉義縣',
  '屏東縣',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
  '台東縣',
  '澎湖縣',
  '金門縣',
  '連江縣'
];

/** Coarse region for filtering: a county (normalised 台→臺), '不限地點', or '' (unclassified). */
const regionOf = (loc: string): string => {
  const s = loc || '';
  for (const c of COUNTIES) if (s.includes(c)) return c.replace('台', '臺');
  if (s.includes('不限')) return '不限地點';
  return '';
};

const SOURCE_NAMES: Record<string, string> = {
  biji: '運動筆記',
  marathonsworld: '馬拉松世界'
};
/** Display name for a race's source; falls back to inferring from the link. */
const sourceLabel = (r: { source?: string; registrationLink: string }): string => {
  const s =
    r.source ||
    (/running\.biji\.co/.test(r.registrationLink)
      ? 'biji'
      : /marathonsworld\.com/.test(r.registrationLink)
        ? 'marathonsworld'
        : '');
  return SOURCE_NAMES[s] || '';
};

const pad = (n: number): string => String(n).padStart(2, '0');
const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const localeOf = (): string => (StateManager.getLanguage() === 'zh' ? 'zh-TW' : 'en');

/** Registration status from the close date: 報名中 / 即將截止(≤7d) / 已截止, or null. */
const regStatus = (regClose: string, todayMs: number): { label: string; cls: string } | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(regClose)) return null;
  const [y, m, d] = regClose.split('-').map(Number);
  const closeMs = new Date(y, m - 1, d, 23, 59, 59).getTime();
  const days = Math.ceil((closeMs - todayMs) / 86400000);
  const by = TranslationManager.format('allraces_reg_close', { date: `${pad(m)}/${pad(d)}` });
  const [cls, key] =
    days < 0
      ? ['closed', 'allraces_reg_closed']
      : days <= 7
        ? ['closing', 'allraces_reg_closing']
        : ['open', 'allraces_reg_open'];
  return { label: `${by} · ${TranslationManager.get(key)}`, cls };
};

const SELECT_IDS = [
  'all-races-month',
  'all-races-region',
  'all-races-distance',
  'all-races-search',
  'all-races-upcoming'
];

export class AllRacesController {
  static initialize(): void {
    SELECT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => this.render());
      el?.addEventListener('change', () => this.render());
    });
    void RaceDataManager.fetchRaces().then(() => this.render());
    this.render();
  }

  /** Re-render on language toggle (DYNAMIC_VIEWS contract). */
  static calculate(): void {
    this.render();
  }

  private static getVal(id: string): string {
    return (
      (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value || ''
    );
  }

  /** Rebuild month + region dropdowns from data, preserving the current choice. */
  private static populateFilters(all: { date: string; location: string }[], loc: string): void {
    const t = TranslationManager.getDict();
    const monthEl = document.getElementById('all-races-month') as HTMLSelectElement | null;
    const regionEl = document.getElementById('all-races-region') as HTMLSelectElement | null;
    const monthLabel = (ym: string): string => {
      const [y, m] = ym.split('-').map(Number);
      return new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long' }).format(
        new Date(y, m - 1, 1)
      );
    };

    if (monthEl) {
      const cur = monthEl.value;
      const months = [...new Set(all.map((r) => r.date.slice(0, 7)))].sort();
      monthEl.innerHTML =
        `<option value="">${esc(t.allraces_month_all || '全部月份')}</option>` +
        months.map((ym) => `<option value="${esc(ym)}">${esc(monthLabel(ym))}</option>`).join('');
      monthEl.value = months.includes(cur) ? cur : '';
    }
    if (regionEl) {
      const cur = regionEl.value;
      const regions = [...new Set(all.map((r) => regionOf(r.location)).filter(Boolean))].sort();
      const hasNone = all.some((r) => !regionOf(r.location));
      regionEl.innerHTML =
        `<option value="">${esc(t.allraces_region_all || '全部地點')}</option>` +
        regions.map((rg) => `<option value="${esc(rg)}">${esc(rg)}</option>`).join('') +
        (hasNone
          ? `<option value="__none__">${esc(t.allraces_unclassified || '未分類')}</option>`
          : '');
      regionEl.value = [...regions, '', '__none__'].includes(cur) ? cur : '';
    }

    // Distance filter: a fixed category set (not data-derived). Labels are
    // re-translated on every render so a language toggle relabels the dropdown.
    const distEl = document.getElementById('all-races-distance') as HTMLSelectElement | null;
    if (distEl) {
      const cur = distEl.value;
      distEl.innerHTML =
        `<option value="">${esc(t.allraces_distance_all || '全部距離')}</option>` +
        DISTANCE_CATEGORIES.map(
          (c) =>
            `<option value="${c}">${esc(TranslationManager.get('allraces_dist_' + c))}</option>`
        ).join('');
      distEl.value = cur === '' || (DISTANCE_CATEGORIES as string[]).includes(cur) ? cur : '';
    }
  }

  static render(): void {
    const listEl = document.getElementById('all-races-list');
    if (!listEl) return;
    const t = TranslationManager.getDict();
    const loc = localeOf();

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
      this.populateFilters(all, loc);
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    this.populateFilters(all, loc);

    const month = this.getVal('all-races-month');
    const region = this.getVal('all-races-region');
    const distance = this.getVal('all-races-distance');
    const upcoming =
      (document.getElementById('all-races-upcoming') as HTMLInputElement | null)?.checked ?? false;
    const q = this.getVal('all-races-search').trim().toLowerCase();
    const today = todayISO();

    const races = all.filter((r) => {
      if (month && !r.date.startsWith(month)) return false;
      if (region) {
        const rg = regionOf(r.location);
        if (region === '__none__' ? rg !== '' : rg !== region) return false;
      }
      if (distance && !raceMatchesDistance(r.distances, distance as DistanceCategory)) return false;
      if (upcoming && r.date < today) return false;
      if (q && !`${r.name} ${r.location} ${r.date}`.toLowerCase().includes(q)) return false;
      return true;
    });

    if (countEl) {
      countEl.textContent = TranslationManager.format('allraces_count', {
        shown: races.length,
        total: all.length
      });
    }

    const updatedEl = document.getElementById('all-races-updated');
    if (updatedEl) {
      const iso = RaceDataManager.getUpdatedAt();
      const dt = iso ? new Date(iso) : null;
      updatedEl.textContent =
        dt && !isNaN(dt.getTime())
          ? TranslationManager.format('allraces_updated', {
              date: new Intl.DateTimeFormat(loc, { dateStyle: 'short', timeStyle: 'short' }).format(
                dt
              )
            })
          : '';
    }

    if (!races.length) {
      listEl.innerHTML = `<div class="helper-text" style="padding:10px 0;">${esc(t.allraces_no_match || '沒有符合條件的賽事')}</div>`;
      return;
    }

    const wdFmt = new Intl.DateTimeFormat(loc, { weekday: 'short' });
    const monthLabel = (ym: string): string => {
      const [y, m] = ym.split('-').map(Number);
      return new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'long' }).format(
        new Date(y, m - 1, 1)
      );
    };
    const todayMs = new Date(`${today}T00:00:00`).getTime();

    // Group by YYYY-MM (races already date-sorted ascending).
    const groups = new Map<string, typeof races>();
    for (const r of races) {
      const k = r.date.slice(0, 7);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(r);
    }

    let html = '';
    for (const [ym, list] of groups) {
      html += `<div class="race-month">${esc(monthLabel(ym))} · ${list.length}</div>`;
      for (const r of list) {
        const [y, m, d] = r.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const diff = Math.round((dt.getTime() - todayMs) / 86400000);
        const cd =
          diff > 0
            ? TranslationManager.format('allraces_in_days', { n: diff })
            : diff === 0
              ? t.allraces_today || '今天'
              : t.allraces_past || '已結束';
        const cdCls = diff < 0 ? 'past' : diff <= 14 ? 'soon' : '';
        const rg = regionOf(r.location);
        const regionLabel = rg || r.location || t.allraces_unclassified || '未分類';
        const dist = r.distances || '';
        const src = sourceLabel(r);
        const reg = regStatus(r.regClose || '', todayMs);
        const link = esc(r.registrationLink || '');
        const name = link
          ? `<a class="race-name" href="${link}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a>`
          : `<span class="race-name">${esc(r.name)}</span>`;
        html +=
          `<div class="race-row${diff < 0 ? ' race-row-past' : ''}">` +
          `<div class="race-date"><span class="race-md">${pad(m)}/${pad(d)}</span><span class="race-wd">${esc(wdFmt.format(dt))}</span></div>` +
          `<div class="race-body">${name}<div class="race-meta">` +
          `<span class="race-region">📍 ${esc(regionLabel)}</span>` +
          (dist ? `<span class="race-dist">🏁 ${esc(dist)}</span>` : '') +
          (reg ? `<span class="race-reg ${reg.cls}">${esc(reg.label)}</span>` : '') +
          (src ? `<span class="race-src">${esc(src)}</span>` : '') +
          `<span class="race-cd ${cdCls}">${esc(cd)}</span>` +
          `</div></div>` +
          (link
            ? `<a class="race-go" href="${link}" target="_blank" rel="noopener noreferrer" aria-label="${esc(r.name)}">↗</a>`
            : '') +
          `</div>`;
      }
    }
    listEl.innerHTML = html;
  }
}

export default AllRacesController;
