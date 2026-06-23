/**
 * HrvController
 * Wires the HRV readiness UI: a series of morning RMSSD readings → baseline
 * band, today's status (suppressed/normal/elevated) and a training suggestion.
 */

import HrvCalculator from '../../core/HrvCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { THrvStatus } from '../../core/HrvCalculator.js';

const STATUS_RISK: Record<THrvStatus, string> = {
  low: 'high',
  normal: 'low',
  high: 'moderate'
};
const OUTPUT_IDS = ['hrv-baseline', 'hrv-today', 'hrv-band', 'hrv-cv'];

export class HrvController {
  static initialize(): void {
    document.getElementById('hrv-input')?.addEventListener('input', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const statusEl = document.getElementById('hrv-status');
    const adviceEl = document.getElementById('hrv-advice');
    if (!statusEl) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    const raw = (document.getElementById('hrv-input') as HTMLInputElement | null)?.value || '';
    const rmssd = raw
      .split(/[\s,]+/)
      .map((s) => parseFloat(s))
      .filter((v) => isFinite(v));
    const r = HrvCalculator.analyze(rmssd);

    if (!r) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      statusEl.textContent = '--';
      statusEl.className = '';
      if (adviceEl) adviceEl.textContent = '';
      return;
    }

    const t = TranslationManager.getAll();
    set('hrv-baseline', String(r.baseline));
    set('hrv-today', String(r.today));
    set('hrv-band', `${r.lower}–${r.upper}`);
    set('hrv-cv', `${r.cv}%`);
    statusEl.textContent = t[`hrv_status_${r.status}`] || r.status;
    statusEl.className = `risk-badge risk-${STATUS_RISK[r.status]}`;
    if (adviceEl) adviceEl.textContent = t[`hrv_advice_${r.status}`] || '';
  }
}

export default HrvController;
