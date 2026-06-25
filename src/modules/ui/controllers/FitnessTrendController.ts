/**
 * FitnessTrendController
 * Logs past race results and renders a VDOT-over-time trend plus per-distance
 * personal bests. The log persists locally (RaceLogStore) and rides cloud sync.
 */

import RaceLog from '../../core/RaceLog.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import RaceLogStore from '../../state/RaceLogStore.js';
import { lineTrend } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import SyncController from './SyncController.js';
import { HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../../../constants/index.js';

const DISTANCES: { key: string; meters: number; label: string }[] = [
  { key: '5k', meters: 5000, label: '5K' },
  { key: '10k', meters: 10000, label: '10K' },
  { key: 'half', meters: HALF_MARATHON_METERS, label: '21.1K' },
  { key: 'full', meters: FULL_MARATHON_METERS, label: '42.2K' }
];
const distLabel = (m: number): string => DISTANCES.find((d) => d.meters === m)?.label || `${m} m`;

export class FitnessTrendController {
  static initialize(): void {
    document.getElementById('trend-add-btn')?.addEventListener('click', () => this.add());
    // "Log this result" button on the VDOT card.
    document.getElementById('vdot-log-btn')?.addEventListener('click', () => this.logFromVdot());
    // Delete via event delegation on the list.
    document.getElementById('trend-list')?.addEventListener('click', (ev) => {
      const btn = (ev.target as HTMLElement | null)?.closest('[data-trend-del]');
      const id = btn?.getAttribute('data-trend-del');
      if (id) {
        RaceLogStore.remove(id);
        SyncController.schedulePush();
        this.calculate();
      }
    });
    this.calculate();
  }

  private static logResult(date: string, meters: number, timeSec: number | null): boolean {
    if (!date || !(meters > 0) || timeSec === null || !(timeSec > 0)) return false;
    RaceLogStore.add({ id: '', date, distanceMeters: meters, timeSec });
    SyncController.schedulePush();
    this.calculate();
    return true;
  }

  private static add(): void {
    const date = (document.getElementById('trend-date') as HTMLInputElement | null)?.value || '';
    const distVal = (document.getElementById('trend-dist-select') as HTMLSelectElement | null)
      ?.value;
    const meters = DISTANCES.find((d) => d.key === distVal)?.meters || 0;
    const timeSec = TimeFormatter.tryParse(
      (document.getElementById('trend-time-input') as HTMLInputElement | null)?.value || ''
    );
    if (this.logResult(date, meters, timeSec)) {
      const timeEl = document.getElementById('trend-time-input') as HTMLInputElement | null;
      if (timeEl) timeEl.value = '';
    }
  }

  /** Copy the VDOT tool's race input into the log (today's date). */
  private static logFromVdot(): void {
    const meters = parseFloat(
      (document.getElementById('vdot-dist-select') as HTMLSelectElement | null)?.value || ''
    );
    const timeSec = TimeFormatter.tryParse(
      (document.getElementById('vdot-time-input') as HTMLInputElement | null)?.value || ''
    );
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.logResult(iso, meters, timeSec);
  }

  static calculate(): void {
    const listEl = document.getElementById('trend-list');
    if (!listEl) return;
    const t = TranslationManager.getDict();
    const entries = RaceLogStore.all();
    const { vdotTrend, pbByDistance } = RaceLog.analyze(entries);

    // Entry list (newest first), each with a delete button.
    listEl.innerHTML = entries.length
      ? entries
          .slice()
          .reverse()
          .map((e, i) => {
            const vdot = vdotTrend[entries.length - 1 - i]?.vdot ?? '';
            return (
              `<div class="fuel-row"><span>${e.date}</span>` +
              `<span>${distLabel(e.distanceMeters)}</span>` +
              `<span class="mono-text">${TimeFormatter.format(e.timeSec)}</span>` +
              `<span class="mono-text">VDOT ${vdot}</span>` +
              `<span><button type="button" class="detail-toggle" data-trend-del="${e.id}" aria-label="${t.trend_delete || 'delete'}">✕</button></span></div>`
            );
          })
          .join('')
      : `<div class="helper-text">${t.trend_empty || ''}</div>`;

    // Per-distance PB table.
    const pbEl = document.getElementById('trend-pb');
    if (pbEl) {
      pbEl.innerHTML = pbByDistance.length
        ? pbByDistance
            .map(
              (p) =>
                `<span class="zone-badge">🏅</span><span>${distLabel(p.distanceMeters)}</span>` +
                `<span class="mono-text vdot-pace">${TimeFormatter.format(p.entry.timeSec)} · ${TimeFormatter.format(p.paceSec)}/km · VDOT ${p.vdot}</span>`
            )
            .join('')
        : '';
    }

    if (vdotTrend.length < 2) {
      renderInsight('trend', { ok: false });
      return;
    }
    const best = Math.max(...vdotTrend.map((p) => p.vdot));
    const recent = vdotTrend[vdotTrend.length - 1].vdot;
    renderInsight('trend', {
      ok: true,
      chartHtml: lineTrend(vdotTrend.map((p) => ({ label: p.date.slice(5), value: p.vdot }))),
      readoutText: TranslationManager.format('trend_readout', { best, recent })
    });
  }
}

export default FitnessTrendController;
