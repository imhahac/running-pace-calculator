/**
 * CoolingController
 * Wires the pre-cooling UI (weight, temp, humidity → WBGT, heat risk, ice-slurry
 * dose and an escalating list of cooling strategies). Reuses env_risk_* labels.
 */

import CoolingCalculator from '../../core/CoolingCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import { num, setText as set } from './dom.js';

export class CoolingController {
  static initialize(): void {
    ['cool-weight-input', 'cool-temp-input', 'cool-humidity-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const riskEl = document.getElementById('cool-risk');
    const strategiesEl = document.getElementById('cool-strategies');
    if (!riskEl || !strategiesEl) return;

    const weight = num('cool-weight-input');
    const temp = num('cool-temp-input');
    const rh = num('cool-humidity-input');

    if (!isFinite(temp) || !isFinite(rh)) {
      set('cool-wbgt', '--');
      set('cool-slurry', '--');
      riskEl.textContent = '--';
      riskEl.className = '';
      strategiesEl.innerHTML = '';
      renderInsight('cool', { ok: false });
      return;
    }

    const p = CoolingCalculator.plan(weight, temp, rh);
    const t = TranslationManager.getDict();
    set('cool-wbgt', `${p.wbgtC}°C`);
    set('cool-slurry', p.iceSlurryG > 0 ? `${p.iceSlurryG} g` : '--');
    const riskLabel = t[`env_risk_${p.risk}`] || p.risk;
    riskEl.textContent = riskLabel;
    riskEl.className = `risk-badge risk-${p.risk}`;
    strategiesEl.innerHTML = p.strategyKeys.map((k) => `<li>${t[`cool_${k}`] || k}</li>`).join('');

    renderInsight('cool', {
      ok: true,
      chartHtml: gauge({
        value: p.wbgtC,
        min: 10,
        max: 32,
        valueLabel: `WBGT ${p.wbgtC}°C`,
        bands: [
          { upTo: 18, cls: 'good' },
          { upTo: 23, cls: 'warn' },
          { upTo: 32, cls: 'bad' }
        ]
      }),
      readoutText: TranslationManager.format('cool_readout', {
        wbgt: p.wbgtC,
        risk: riskLabel,
        slurry: p.iceSlurryG > 0 ? `${p.iceSlurryG} g` : '—'
      })
    });
  }
}

export default CoolingController;
