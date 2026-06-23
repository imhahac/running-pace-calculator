/**
 * RunningEconomyController
 * Wires the running economy + body-composition UI (5K time → VO₂max, sex +
 * body-fat % → band) and shows a three-layer improvement strategy.
 */

import RunningEconomyCalculator from '../../core/RunningEconomyCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { TSex } from '../../core/RunningEconomyCalculator.js';

const BAND_RISK: Record<string, string> = {
  essential: 'low',
  athlete: 'low',
  fitness: 'moderate',
  average: 'moderate',
  high: 'high'
};

export class RunningEconomyController {
  static initialize(): void {
    ['re-5k-input', 're-bf-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    document.getElementById('re-sex-select')?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    // Re-render the (language-dependent) strategy list each pass so a language
    // toggle re-runs translate it via the shared refresh.
    this.renderStrategies();
    const bandEl = document.getElementById('re-band');
    if (!bandEl) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    const sec = TimeFormatter.tryParse(
      (document.getElementById('re-5k-input') as HTMLInputElement | null)?.value || ''
    );
    const bf = parseFloat(
      (document.getElementById('re-bf-input') as HTMLInputElement | null)?.value || ''
    );
    const sex: TSex =
      (document.getElementById('re-sex-select') as HTMLSelectElement | null)?.value === 'female'
        ? 'female'
        : 'male';

    const vo2 = sec !== null && sec > 0 ? RunningEconomyCalculator.vo2maxFrom5k(sec) : 0;
    set('re-vo2max', vo2 > 0 ? vo2.toFixed(1) : '--');

    const t = TranslationManager.getAll();
    const bandKey = RunningEconomyCalculator.bodyFatBand(sex, bf);
    if (bandKey) {
      bandEl.textContent = t[`re_band_${bandKey}`] || bandKey;
      bandEl.className = `risk-badge risk-${BAND_RISK[bandKey] || 'moderate'}`;
    } else {
      bandEl.textContent = '--';
      bandEl.className = '';
    }
  }

  private static renderStrategies(): void {
    const el = document.getElementById('re-strategies');
    if (!el) return;
    const t = TranslationManager.getAll();
    el.innerHTML = ['strength', 'plyo', 'bodycomp']
      .map((k) => `<li>${t[`re_strat_${k}`] || k}</li>`)
      .join('');
  }
}

export default RunningEconomyController;
