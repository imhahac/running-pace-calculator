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
import { num, setText, pickOption } from './dom.js';
import type { TAcclim, TEnvMode } from '../../core/EnvironmentalPaceCalculator.js';

const OUTPUT_IDS = [
  'env-dewpoint',
  'env-wbgt',
  'env-risk',
  'env-heat-pct',
  'env-grade-factor',
  'env-adjusted-pace'
];
const ACCLIMS: TAcclim[] = ['none', 'partial', 'full'];

export class EnvironmentalController {
  static initialize(): void {
    ['env-temp-input', 'env-humidity-input', 'env-pace-input', 'env-grade-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    ['env-mode-select', 'env-acclim-select'].forEach((id) =>
      document.getElementById(id)?.addEventListener('change', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const riskEl = document.getElementById('env-risk');
    if (!riskEl) return;

    const t = TranslationManager.getDict();

    // forward = predict hot/hilly pace from a flat-cool target; reverse = back
    // out the flat-cool-equivalent from a pace run in the heat.
    const modeVal = (document.getElementById('env-mode-select') as HTMLSelectElement | null)?.value;
    const mode: TEnvMode = pickOption(modeVal, ['forward', 'reverse'] as const, 'forward');
    const acclimVal = (document.getElementById('env-acclim-select') as HTMLSelectElement | null)
      ?.value;
    const acclim: TAcclim = pickOption(acclimVal, ACCLIMS, 'none');

    // Result-row label flips with the mode. It carries no data-i18n, so set it
    // here — the language toggle re-runs calculate() and re-translates it.
    setText(
      'env-result-label',
      mode === 'reverse' ? t.env_result_rev || '' : t.env_adjusted_label || ''
    );

    const temp = num('env-temp-input');
    const rh = num('env-humidity-input');
    const grade = num('env-grade-input') || 0;
    const baseSec = TimeFormatter.tryParse(
      (document.getElementById('env-pace-input') as HTMLInputElement | null)?.value || ''
    );

    if (!isFinite(temp) || !isFinite(rh) || baseSec === null || baseSec <= 0) {
      OUTPUT_IDS.forEach((id) => setText(id, '--'));
      riskEl.className = '';
      renderInsight('env', { ok: false });
      return;
    }

    const r = EnvironmentalPaceCalculator.adjust(baseSec, temp, rh, grade, acclim, mode);
    setText('env-dewpoint', `${r.dewPointC}°C`);
    setText('env-wbgt', `${r.wbgtC}°C`);
    setText('env-heat-pct', `+${r.heatPct}%`);
    setText('env-grade-factor', `×${r.gradeFactor}`);
    setText('env-adjusted-pace', `${TimeFormatter.format(r.adjustedPaceSec)}/km`);
    const riskLabel = t[`env_risk_${r.risk}`] || r.risk;
    riskEl.textContent = riskLabel;
    riskEl.className = `risk-badge risk-${r.risk}`;

    let readout = TranslationManager.format(
      mode === 'reverse' ? 'env_readout_reverse' : 'env_readout',
      {
        wbgt: r.wbgtC,
        risk: riskLabel,
        pct: r.heatPct,
        pace: `${TimeFormatter.format(r.adjustedPaceSec)}/km`
      }
    );
    // Hydration caution once heat stress is High/Extreme (>2% body-mass sweat
    // loss starts to hurt performance — Garmin/heat-acclimatisation guidance).
    if (r.risk === 'high' || r.risk === 'extreme') readout += ` ${t.env_sweat_warn || ''}`;

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
      readoutText: readout.trim()
    });
  }
}

export default EnvironmentalController;
