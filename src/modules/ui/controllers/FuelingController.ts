/**
 * FuelingController
 * Wires the calorie + in-race fueling timeline UI (weight, distance, finish
 * time → total kcal, carb/fluid rates and a per-station schedule).
 */

import FuelingCalculator from '../../core/FuelingCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';

const OUTPUT_IDS = ['fuel-kcal', 'fuel-carbrate', 'fuel-fluidrate', 'fuel-totalcarb'];

export class FuelingController {
  static initialize(): void {
    ['fuel-weight-input', 'fuel-dist-select', 'fuel-time-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    document.getElementById('fuel-dist-select')?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const timeline = document.getElementById('fuel-timeline');
    if (!timeline) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');

    const weight = num('fuel-weight-input');
    const distM = num('fuel-dist-select');
    const finishSec = TimeFormatter.tryParse(
      (document.getElementById('fuel-time-input') as HTMLInputElement | null)?.value || ''
    );

    if (!(weight > 0) || !(distM > 0) || finishSec === null || finishSec <= 0) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      timeline.innerHTML = '';
      return;
    }

    const p = FuelingCalculator.plan(distM / 1000, finishSec, weight);
    const t = TranslationManager.getAll();
    set('fuel-kcal', `${p.totalKcal} kcal`);
    set('fuel-carbrate', `${p.carbRateGh} g/h`);
    set('fuel-fluidrate', `${p.fluidRateMlh} ml/h`);
    set('fuel-totalcarb', `${p.totalCarbG} g`);

    const head = `<div class="fuel-row fuel-head"><span>${t.col_km || 'km'}</span><span>${t.col_time || ''}</span><span>💧 ml</span><span>🍬 g</span></div>`;
    timeline.innerHTML =
      head +
      p.stations
        .map(
          (s) =>
            `<div class="fuel-row"><span>${s.km}</span><span class="mono-text">${TimeFormatter.format(s.timeSec)}</span><span class="mono-text">${s.fluidMl}</span><span class="mono-text">${s.carbG}</span></div>`
        )
        .join('');
  }
}

export default FuelingController;
