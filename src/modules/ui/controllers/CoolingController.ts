/**
 * CoolingController
 * Wires the pre-cooling UI (weight, temp, humidity → WBGT, heat risk, ice-slurry
 * dose and an escalating list of cooling strategies). Reuses env_risk_* labels.
 */

import CoolingCalculator from '../../core/CoolingCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';

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
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');

    const weight = num('cool-weight-input');
    const temp = num('cool-temp-input');
    const rh = num('cool-humidity-input');

    if (!isFinite(temp) || !isFinite(rh)) {
      set('cool-wbgt', '--');
      set('cool-slurry', '--');
      riskEl.textContent = '--';
      riskEl.className = '';
      strategiesEl.innerHTML = '';
      return;
    }

    const p = CoolingCalculator.plan(weight, temp, rh);
    const t = TranslationManager.getAll();
    set('cool-wbgt', `${p.wbgtC}°C`);
    set('cool-slurry', p.iceSlurryG > 0 ? `${p.iceSlurryG} g` : '--');
    riskEl.textContent = t[`env_risk_${p.risk}`] || p.risk;
    riskEl.className = `risk-badge risk-${p.risk}`;
    strategiesEl.innerHTML = p.strategyKeys.map((k) => `<li>${t[`cool_${k}`] || k}</li>`).join('');
  }
}

export default CoolingController;
