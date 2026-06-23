/**
 * GlycogenController
 * Wires the carb-loading UI (weight + protocol → daily carbohydrate schedule).
 */

import GlycogenCalculator from '../../core/GlycogenCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { TGlycogenProtocol } from '../../core/GlycogenCalculator.js';

const PROTOCOLS: TGlycogenProtocol[] = ['modifiedSherman', 'classic', 'wa'];

export class GlycogenController {
  static initialize(): void {
    document
      .getElementById('glyco-weight-input')
      ?.addEventListener('input', () => this.calculate());
    document
      .getElementById('glyco-protocol-select')
      ?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const schedule = document.getElementById('glyco-schedule');
    const loadEl = document.getElementById('glyco-load');
    if (!schedule || !loadEl) return;

    const weight = parseFloat(
      (document.getElementById('glyco-weight-input') as HTMLInputElement | null)?.value || ''
    );
    const sel = (document.getElementById('glyco-protocol-select') as HTMLSelectElement | null)
      ?.value;
    const protocol: TGlycogenProtocol = PROTOCOLS.includes(sel as TGlycogenProtocol)
      ? (sel as TGlycogenProtocol)
      : 'modifiedSherman';

    if (!(weight > 0)) {
      loadEl.textContent = '--';
      schedule.innerHTML = '';
      return;
    }

    const p = GlycogenCalculator.plan(weight, protocol);
    const t = TranslationManager.getAll();
    loadEl.textContent = `${p.loadGperKg} g/kg · ${t.glyco_peak || 'peak'} ${p.peakCarbG} g`;
    schedule.innerHTML = p.days
      .map((d) => {
        const dayLabel = d.dayOffset === 0 ? t.glyco_raceday || 'Race day' : `D${d.dayOffset}`;
        const train = t[`glyco_train_${d.trainingKey}`] || d.trainingKey;
        return `<div class="fuel-row"><span>${dayLabel}</span><span>${d.carbGperKg} g/kg</span><span class="mono-text">${d.carbG} g</span><span>${train}</span></div>`;
      })
      .join('');
  }
}

export default GlycogenController;
