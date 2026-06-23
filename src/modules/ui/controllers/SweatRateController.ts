/**
 * SweatRateController
 * Wires the personalised long-run hydration UI (weight, pace, distance, temp,
 * humidity → sweat rate and a per-station fluid/carb/sodium plan).
 */

import SweatRateCalculator from '../../core/SweatRateCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { barSeries } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

const INPUT_IDS = [
  'sweat-weight-input',
  'sweat-pace-input',
  'sweat-dist-input',
  'sweat-temp-input',
  'sweat-humidity-input'
];
const OUTPUT_IDS = ['sweat-rate', 'sweat-fluidrate', 'sweat-sodiumrate', 'sweat-carbrate'];

export class SweatRateController {
  static initialize(): void {
    INPUT_IDS.forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const timeline = document.getElementById('sweat-timeline');
    if (!timeline) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');

    const weight = num('sweat-weight-input');
    const distKm = num('sweat-dist-input');
    const temp = num('sweat-temp-input');
    const rh = num('sweat-humidity-input');
    const paceSec = TimeFormatter.tryParse(
      (document.getElementById('sweat-pace-input') as HTMLInputElement | null)?.value || ''
    );

    if (
      !(weight > 0) ||
      paceSec === null ||
      paceSec <= 0 ||
      !(distKm > 0) ||
      !isFinite(temp) ||
      !isFinite(rh)
    ) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      timeline.innerHTML = '';
      renderInsight('sweat', { ok: false });
      return;
    }

    const p = SweatRateCalculator.plan(weight, paceSec, distKm, temp, rh);
    const t = TranslationManager.getDict();
    set('sweat-rate', `${p.sweatRateLh} L/h`);
    set('sweat-fluidrate', `${p.fluidRateMlh} ml/h`);
    set('sweat-sodiumrate', `${p.sodiumRateMgh} mg/h`);
    set('sweat-carbrate', `${p.carbRateGh} g/h`);

    renderInsight('sweat', {
      ok: true,
      // Fluid to take at each station (ml).
      chartHtml: barSeries(
        p.stations.map((s) => ({ label: `${s.km}`, value: s.fluidMl, caption: `${s.fluidMl}` }))
      ),
      readoutText: TranslationManager.format('sweat_readout', {
        rate: p.sweatRateLh,
        fluid: p.fluidRateMlh,
        sodium: p.sodiumRateMgh,
        carb: p.carbRateGh
      })
    });

    const head = `<div class="fuel-row fuel-head"><span>${t.col_km || 'km'}</span><span>💧 ml</span><span>🍬 g</span><span>🧂 mg</span></div>`;
    timeline.innerHTML =
      head +
      p.stations
        .map(
          (s) =>
            `<div class="fuel-row"><span>${s.km}</span><span class="mono-text">${s.fluidMl}</span><span class="mono-text">${s.carbG}</span><span class="mono-text">${s.sodiumMg}</span></div>`
        )
        .join('');
  }
}

export default SweatRateController;
