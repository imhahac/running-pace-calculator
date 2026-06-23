/**
 * RecoveryController
 * Wires the post-race recovery UI (distance, effort, age → recommended easy
 * days, days before hard training and a recovery-strategy checklist).
 */

import RecoveryCalculator from '../../core/RecoveryCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { TEffort } from '../../core/RecoveryCalculator.js';

const EFFORTS: TEffort[] = ['easy', 'moderate', 'hard', 'allout'];

export class RecoveryController {
  static initialize(): void {
    ['rec-dist-select', 'rec-effort-select', 'rec-age-input'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => this.calculate());
      el?.addEventListener('change', () => this.calculate());
    });
    this.calculate();
  }

  static calculate(): void {
    const strategiesEl = document.getElementById('rec-strategies');
    if (!strategiesEl) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    const distM = parseFloat(
      (document.getElementById('rec-dist-select') as HTMLSelectElement | null)?.value || ''
    );
    const effortVal = (document.getElementById('rec-effort-select') as HTMLSelectElement | null)
      ?.value;
    const effort: TEffort = EFFORTS.includes(effortVal as TEffort)
      ? (effortVal as TEffort)
      : 'hard';
    const age = parseInt(
      (document.getElementById('rec-age-input') as HTMLInputElement | null)?.value || '35',
      10
    );

    if (!(distM > 0)) {
      set('rec-before-hard', '--');
      set('rec-easy', '--');
      strategiesEl.innerHTML = '';
      return;
    }

    const p = RecoveryCalculator.recovery(distM / 1000, effort, isFinite(age) ? age : 35);
    const t = TranslationManager.getAll();
    const daysLabel = t.rec_days || 'days';
    set('rec-before-hard', `${p.beforeHardDays} ${daysLabel}`);
    set('rec-easy', `${p.easyDays} ${daysLabel}`);
    strategiesEl.innerHTML = p.strategyKeys.map((k) => `<li>${t[`rec_${k}`] || k}</li>`).join('');
  }
}

export default RecoveryController;
