/**
 * MenstrualController
 * Wires the menstrual-cycle UI: cycle day + length → current phase and a
 * phase-based training micro-adjustment (with a "listen to your body" caveat).
 */

import MenstrualCalculator from '../../core/MenstrualCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { phaseStrip } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

/** Typical phase order + relative span (days of a ~28-day cycle) for the strip. */
const CYCLE_PHASES: { key: string; weight: number }[] = [
  { key: 'menstrual', weight: 5 },
  { key: 'follicular', weight: 8 },
  { key: 'ovulation', weight: 2 },
  { key: 'luteal', weight: 13 }
];

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
      renderInsight('cycle', { ok: false });
      return;
    }

    const t = TranslationManager.getDict();
    phaseEl.textContent = t[`menstrual_phase_${phase}`] || phase;
    phaseEl.className = 'risk-badge risk-moderate';
    if (adviceEl) adviceEl.textContent = t[`menstrual_advice_${phase}`] || '';

    // Cycle strip with the current phase highlighted.
    renderInsight('cycle', {
      ok: true,
      chartHtml: phaseStrip(
        CYCLE_PHASES.map((p) => ({
          label: t[`menstrual_phase_${p.key}`] || p.key,
          weight: p.weight,
          cls: p.key === phase ? 'z5' : 'z2'
        }))
      )
    });
  }
}

export default MenstrualController;
