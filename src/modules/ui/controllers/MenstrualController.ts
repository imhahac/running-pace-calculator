/**
 * MenstrualController
 * Wires the menstrual-cycle UI: cycle day + length → current phase, plus
 * optional symptom inputs (period pain, mood, sleep) that produce a combined
 * training-readiness recommendation, a luteal fuelling tip and a RED-S warning.
 */

import MenstrualCalculator from '../../core/MenstrualCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { phaseStrip } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import type { TDysmenorrhea, TMood, TReadiness } from '../../core/MenstrualCalculator.js';

/** Typical phase order + relative span (days of a ~28-day cycle) for the strip. */
const CYCLE_PHASES: { key: string; weight: number }[] = [
  { key: 'menstrual', weight: 5 },
  { key: 'follicular', weight: 8 },
  { key: 'ovulation', weight: 2 },
  { key: 'luteal', weight: 13 }
];
const READINESS_RISK: Record<TReadiness, string> = { go: 'low', caution: 'moderate', easy: 'high' };
const DYSMENORRHEA: TDysmenorrhea[] = ['none', 'mild', 'moderate', 'severe'];
const MOODS: TMood[] = ['good', 'normal', 'low'];

export class MenstrualController {
  static initialize(): void {
    ['cycle-day-input', 'cycle-length-input', 'cycle-sleep-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    ['cycle-dysmenorrhea-select', 'cycle-mood-select'].forEach((id) =>
      document.getElementById(id)?.addEventListener('change', () => this.calculate())
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

    // Optional day-to-day symptom inputs.
    const dysSel = (
      document.getElementById('cycle-dysmenorrhea-select') as HTMLSelectElement | null
    )?.value;
    const dysmenorrhea = (
      DYSMENORRHEA.includes(dysSel as TDysmenorrhea) ? dysSel : 'none'
    ) as TDysmenorrhea;
    const moodSel = (document.getElementById('cycle-mood-select') as HTMLSelectElement | null)
      ?.value;
    const mood = (MOODS.includes(moodSel as TMood) ? moodSel : 'normal') as TMood;
    const sleepRaw = parseFloat(
      (document.getElementById('cycle-sleep-input') as HTMLInputElement | null)?.value || ''
    );
    const sleepHours = isFinite(sleepRaw) && sleepRaw > 0 ? sleepRaw : undefined;

    const adj = MenstrualCalculator.adjust({
      phase,
      dysmenorrhea,
      mood,
      sleepHours,
      cycleLength: length
    });

    phaseEl.textContent = t[`menstrual_phase_${phase}`] || phase;
    phaseEl.className = `risk-badge risk-${READINESS_RISK[adj.readiness]}`;
    if (adviceEl) adviceEl.textContent = t[`menstrual_advice_${phase}`] || '';

    // Combined readout: symptom-adjusted recommendation + luteal fuelling tip
    // (Carmichael 2021) + RED-S warning (Ackerman 2019) when the cycle is irregular.
    let readout = t[`menstrual_rec_${adj.recommendationKey}`] || '';
    if (phase === 'luteal') readout += ` ${t.menstrual_luteal_fuel || ''}`;
    if (adj.redSFlag) readout += ` ${t.menstrual_reds_warn || ''}`;

    // Cycle strip with the current phase highlighted.
    renderInsight('cycle', {
      ok: true,
      chartHtml: phaseStrip(
        CYCLE_PHASES.map((p) => ({
          label: t[`menstrual_phase_${p.key}`] || p.key,
          weight: p.weight,
          cls: p.key === phase ? 'z5' : 'z2'
        }))
      ),
      readoutText: readout.trim()
    });
  }
}

export default MenstrualController;
