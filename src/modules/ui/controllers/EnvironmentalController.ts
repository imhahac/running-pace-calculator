/**
 * EnvironmentalController
 * Wires the environmental pace-adjustment UI (temperature, humidity, base pace
 * and an optional grade → dew point, WBGT, heat slowdown, grade factor and an
 * adjusted target pace). Pure calculation lives in EnvironmentalPaceCalculator.
 */

import EnvironmentalPaceCalculator from '../../core/EnvironmentalPaceCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

const OUTPUT_IDS = [
  'env-dewpoint',
  'env-wbgt',
  'env-risk',
  'env-heat-pct',
  'env-grade-factor',
  'env-adjusted-pace'
];

export class EnvironmentalController {
  static initialize(): void {
    ['env-temp-input', 'env-humidity-input', 'env-pace-input', 'env-grade-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const riskEl = document.getElementById('env-risk');
    if (!riskEl) return;

    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');
    const set = (id: string, value: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const temp = num('env-temp-input');
    const rh = num('env-humidity-input');
    const grade = num('env-grade-input') || 0;
    const baseSec = TimeFormatter.tryParse(
      (document.getElementById('env-pace-input') as HTMLInputElement | null)?.value || ''
    );

    if (!isFinite(temp) || !isFinite(rh) || baseSec === null || baseSec <= 0) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      riskEl.className = '';
      renderInsight('env', { ok: false });
      return;
    }

    const r = EnvironmentalPaceCalculator.adjust(baseSec, temp, rh, grade);
    const t = TranslationManager.getDict();
    set('env-dewpoint', `${r.dewPointC}°C`);
    set('env-wbgt', `${r.wbgtC}°C`);
    set('env-heat-pct', `+${r.heatPct}%`);
    set('env-grade-factor', `×${r.gradeFactor}`);
    set('env-adjusted-pace', `${TimeFormatter.format(r.adjustedPaceSec)}/km`);
    const riskLabel = t[`env_risk_${r.risk}`] || r.risk;
    riskEl.textContent = riskLabel;
    riskEl.className = `risk-badge risk-${r.risk}`;

    renderInsight('env', {
      ok: true,
      // Heat-stress gauge keyed to the shade-WBGT bands (<18 / 18–23 / 23+).
      chartHtml: gauge({
        value: r.wbgtC,
        min: 10,
        max: 32,
        valueLabel: `WBGT ${r.wbgtC}°C`,
        bands: [
          { upTo: 18, cls: 'good' },
          { upTo: 23, cls: 'warn' },
          { upTo: 32, cls: 'bad' }
        ]
      }),
      readoutText: TranslationManager.format('env_readout', {
        wbgt: r.wbgtC,
        risk: riskLabel,
        pct: r.heatPct,
        pace: `${TimeFormatter.format(r.adjustedPaceSec)}/km`
      })
    });
  }
}

export default EnvironmentalController;
