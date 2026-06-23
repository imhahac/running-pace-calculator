/**
 * MenstrualController
 * Wires the menstrual-cycle UI: cycle day + length → current phase and a
 * phase-based training micro-adjustment (with a "listen to your body" caveat).
 */

import MenstrualCalculator from '../../core/MenstrualCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';

export class MenstrualController {
  static initialize(): void {
    ['cycle-day-input', 'cycle-length-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const phaseEl = document.getElementById('cycle-phase');
    const adviceEl = document.getElementById('cycle-advice');
    if (!phaseEl) return;

    const day = parseInt(
      (document.getElementById('cycle-day-input') as HTMLInputElement | null)?.value || '',
      10
    );
    const length =
      parseInt(
        (document.getElementById('cycle-length-input') as HTMLInputElement | null)?.value || '',
        10
      ) || 28;
    const phase = isFinite(day) ? MenstrualCalculator.phase(day, length) : null;

    if (!phase) {
      phaseEl.textContent = '--';
      phaseEl.className = '';
      if (adviceEl) adviceEl.textContent = '';
      return;
    }

    const t = TranslationManager.getAll();
    phaseEl.textContent = t[`menstrual_phase_${phase}`] || phase;
    phaseEl.className = 'risk-badge risk-moderate';
    if (adviceEl) adviceEl.textContent = t[`menstrual_advice_${phase}`] || '';
  }
}

export default MenstrualController;
