/**
 * RunningEconomyController
 * Wires the running economy + body-composition UI (5K time → VO₂max, sex +
 * body-fat % → band) and shows a three-layer improvement strategy.
 */

import RunningEconomyCalculator from '../../core/RunningEconomyCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import type { TSex } from '../../core/RunningEconomyCalculator.js';
import { setText as set } from './dom.js';

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

    const t = TranslationManager.getDict();
    const bandKey = RunningEconomyCalculator.bodyFatBand(sex, bf);
    if (bandKey) {
      bandEl.textContent = t[`re_band_${bandKey}`] || bandKey;
      bandEl.className = `risk-badge risk-${BAND_RISK[bandKey] || 'moderate'}`;
    } else {
      bandEl.textContent = '--';
      bandEl.className = '';
    }

    renderInsight('re', {
      ok: vo2 > 0,
      // VO₂max gauge — higher is fitter; band edges align with VdotCalculator
      // grade thresholds (recreational 38, intermediate 48).
      chartHtml: gauge({
        value: vo2,
        min: 30,
        max: 75,
        valueLabel: `VO₂max ${vo2.toFixed(1)}`,
        bands: [
          { upTo: 38, cls: 'bad' },
          { upTo: 48, cls: 'warn' },
          { upTo: 75, cls: 'good' }
        ]
      }),
      readoutText: TranslationManager.format('re_readout', {
        vo2: vo2.toFixed(1),
        band: bandKey ? t[`re_band_${bandKey}`] || bandKey : '—'
      })
    });
  }

  private static renderStrategies(): void {
    const el = document.getElementById('re-strategies');
    if (!el) return;
    const t = TranslationManager.getDict();
    el.innerHTML = ['strength', 'plyo', 'bodycomp']
      .map((k) => `<li>${t[`re_strat_${k}`] || k}</li>`)
      .join('');
  }
}

export default RunningEconomyController;
