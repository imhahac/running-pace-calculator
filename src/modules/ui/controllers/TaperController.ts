/**
 * TaperController
 * Wires the pre-race taper UI (peak weekly volume + taper length → a weekly
 * volume-reduction schedule). Intensity is kept; only volume drops.
 */

import TaperCalculator from '../../core/TaperCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';

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
      return;
    }

    const p = TaperCalculator.plan(peak, isFinite(weeks) ? weeks : 2);
    const t = TranslationManager.getAll();
    schedule.innerHTML = p.weeks
      .map((w) => {
        const label =
          w.weeksOut === 1
            ? t.taper_raceweek || 'Race week'
            : `${t.taper_weeksout_prefix || 'T-'}${w.weeksOut}`;
        return `<div class="fuel-row"><span>${label}</span><span>${w.volumePct}%</span><span class="mono-text">${w.volumeKm} km</span></div>`;
      })
      .join('');
  }
}

export default TaperController;
