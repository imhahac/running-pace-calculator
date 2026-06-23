/**
 * TaperController
 * Wires the pre-race taper UI (peak weekly volume + taper length → a weekly
 * volume-reduction schedule). Intensity is kept; only volume drops.
 */

import TaperCalculator from '../../core/TaperCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { barSeries } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

export class TaperController {
  static initialize(): void {
    document.getElementById('taper-peak-input')?.addEventListener('input', () => this.calculate());
    document
      .getElementById('taper-weeks-select')
      ?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const schedule = document.getElementById('taper-schedule');
    if (!schedule) return;

    const peak = parseFloat(
      (document.getElementById('taper-peak-input') as HTMLInputElement | null)?.value || ''
    );
    const weeks = parseInt(
      (document.getElementById('taper-weeks-select') as HTMLSelectElement | null)?.value || '2',
      10
    );

    if (!(peak > 0)) {
      schedule.innerHTML = '';
      renderInsight('taper', { ok: false });
      return;
    }

    const p = TaperCalculator.plan(peak, isFinite(weeks) ? weeks : 2);
    const t = TranslationManager.getDict();
    const label = (weeksOut: number): string =>
      weeksOut === 1
        ? t.taper_raceweek || 'Race week'
        : `${t.taper_weeksout_prefix || 'T-'}${weeksOut}`;
    schedule.innerHTML = p.weeks
      .map(
        (w) =>
          `<div class="fuel-row"><span>${label(w.weeksOut)}</span><span>${w.volumePct}%</span><span class="mono-text">${w.volumeKm} km</span></div>`
      )
      .join('');

    const raceWeek = p.weeks[p.weeks.length - 1];
    renderInsight('taper', {
      ok: true,
      // Volume step-down toward race week (intensity is kept).
      chartHtml: barSeries(
        p.weeks.map((w) => ({
          label: label(w.weeksOut),
          value: w.volumeKm,
          caption: `${w.volumePct}%`
        }))
      ),
      readoutText: TranslationManager.format('taper_readout', {
        weeks: p.weeks.length,
        pct: raceWeek ? raceWeek.volumePct : 0,
        km: raceWeek ? raceWeek.volumeKm : 0
      })
    });
  }
}

export default TaperController;
