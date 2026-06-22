/**
 * HeartRateController
 * Wires the heart-rate zone UI (age + resting HR → max HR, VO2max estimate,
 * and Karvonen 5-zone bpm ranges). Pure calculation lives in
 * HeartRateCalculator.
 */

import HeartRateCalculator from '../../core/HeartRateCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { THrFormula, TVdotZoneKey } from '../../../types/index';

const ZONE_BADGE: Record<TVdotZoneKey, string> = {
  easy: 'E',
  marathon: 'M',
  threshold: 'T',
  interval: 'I',
  repetition: 'R'
};

export class HeartRateController {
  static initialize(): void {
    ['hr-age-input', 'hr-rest-input', 'hr-max-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    document
      .getElementById('hr-formula-select')
      ?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const maxEl = document.getElementById('hr-max-display');
    const vo2El = document.getElementById('hr-vo2-display');
    const zonesEl = document.getElementById('hr-zones');
    if (!maxEl || !vo2El || !zonesEl) return;

    const age = parseInt(
      (document.getElementById('hr-age-input') as HTMLInputElement | null)?.value || '',
      10
    );
    const rest = parseInt(
      (document.getElementById('hr-rest-input') as HTMLInputElement | null)?.value || '',
      10
    );
    const measured = parseInt(
      (document.getElementById('hr-max-input') as HTMLInputElement | null)?.value || '',
      10
    );
    const formula: THrFormula =
      (document.getElementById('hr-formula-select') as HTMLSelectElement | null)?.value === 'fox'
        ? 'fox'
        : 'tanaka';

    const maxHr =
      isFinite(measured) && measured > 0 ? measured : HeartRateCalculator.maxHr(age, formula);

    if (!(maxHr > 0) || !isFinite(rest) || rest <= 0 || maxHr <= rest) {
      maxEl.textContent = '--';
      vo2El.textContent = '--';
      zonesEl.innerHTML = '';
      return;
    }

    maxEl.textContent = String(maxHr);
    vo2El.textContent = HeartRateCalculator.estimateVo2max(maxHr, rest).toFixed(1);

    const t = TranslationManager.getAll();
    const zones = HeartRateCalculator.karvonenZones(maxHr, rest);
    zonesEl.innerHTML = zones
      .map((z) => {
        const desc = t[`zone_${z.key}_desc`] || z.key;
        return `<span class="zone-badge">${ZONE_BADGE[z.key]}</span><span>${desc}</span><span class="mono-text vdot-pace">${z.loBpm}–${z.hiBpm} bpm</span>`;
      })
      .join('');
  }
}

export default HeartRateController;
