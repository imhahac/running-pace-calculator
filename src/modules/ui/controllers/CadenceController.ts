/**
 * CadenceController
 * Wires the cadence-analysis UI: base pace (+ optional current cadence) →
 * recommended cadence band, stride length, +5%/+10% targets and an
 * overstriding flag. Pure calculation lives in CadenceCalculator.
 */

import CadenceCalculator from '../../core/CadenceCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

const OUTPUT_IDS = [
  'cadence-band',
  'cadence-stride',
  'cadence-plus5',
  'cadence-plus10',
  'cadence-advice'
];

export class CadenceController {
  static initialize(): void {
    ['cadence-pace-input', 'cadence-current-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const bandEl = document.getElementById('cadence-band');
    if (!bandEl) return;

    const set = (id: string, value: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const paceSec = TimeFormatter.tryParse(
      (document.getElementById('cadence-pace-input') as HTMLInputElement | null)?.value || ''
    );
    const currentRaw = parseFloat(
      (document.getElementById('cadence-current-input') as HTMLInputElement | null)?.value || ''
    );
    const current = isFinite(currentRaw) && currentRaw > 0 ? currentRaw : undefined;

    if (paceSec === null || paceSec <= 0) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      renderInsight('cadence', { ok: false });
      return;
    }

    const r = CadenceCalculator.analyze(paceSec, current);
    if (!r) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      renderInsight('cadence', { ok: false });
      return;
    }

    const t = TranslationManager.getDict();
    set('cadence-band', `${r.recommendedLo}–${r.recommendedHi} spm`);
    set('cadence-stride', r.strideLengthM !== null ? `${r.strideLengthM} m` : '--');
    set('cadence-plus5', r.plus5 !== null ? `${r.plus5} spm` : '--');
    set('cadence-plus10', r.plus10 !== null ? `${r.plus10} spm` : '--');
    set(
      'cadence-advice',
      current === undefined
        ? t.cadence_advice_input || ''
        : r.overstriding
          ? t.cadence_advice_over || ''
          : t.cadence_advice_ok || ''
    );

    // Gauge: where your current cadence sits vs the recommended band.
    if (current !== undefined) {
      const lo = r.recommendedLo;
      const hi = r.recommendedHi;
      const min = Math.min(lo - 15, current - 5);
      const max = Math.max(hi + 15, current + 5);
      renderInsight('cadence', {
        ok: true,
        chartHtml: gauge({
          value: current,
          min,
          max,
          valueLabel: `${current} spm`,
          bands: [
            { upTo: lo, cls: 'warn' },
            { upTo: hi, cls: 'good' },
            { upTo: max, cls: 'warn' }
          ]
        })
      });
    } else {
      renderInsight('cadence', { ok: false });
    }
  }
}

export default CadenceController;
