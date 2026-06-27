/**
 * HrvController
 * Wires the HRV readiness UI: a series of morning RMSSD readings → baseline
 * band and today's status (suppressed/normal/elevated). Four optional subjective
 * factors (sleep / soreness / stress / mood) are blended with the HRV status into
 * a single today's-training recommendation (HrvCalculator.recommend). Blank
 * subjective fields are ignored; with no RMSSD the recommendation falls back to
 * the subjective signal alone.
 */

import HrvCalculator from '../../core/HrvCalculator.js';
import WellnessCalculator from '../../core/WellnessCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { sparkline } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import type { THrvStatus, THrvRecLevel } from '../../core/HrvCalculator.js';
import type { IWellnessInput } from '../../core/WellnessCalculator.js';
import { setText as set } from './dom.js';

const STATUS_RISK: Record<THrvStatus, string> = {
  low: 'high',
  normal: 'low',
  high: 'moderate'
};
const REC_RISK: Record<THrvRecLevel, string> = {
  quality: 'low',
  moderate: 'moderate',
  easy: 'high',
  rest: 'high'
};
const OUTPUT_IDS = ['hrv-baseline', 'hrv-today', 'hrv-band', 'hrv-cv'];

// The four subjective selects and how their option values map to a 0–2 severity
// (0 = best). An unrecognised / empty value (the "—" option) → not reported.
const WELLNESS_SELECTS: { id: string; key: keyof IWellnessInput; sev: Record<string, number> }[] = [
  { id: 'hrv-sleep-select', key: 'sleep', sev: { good: 0, fair: 1, poor: 2 } },
  { id: 'hrv-soreness-select', key: 'soreness', sev: { none: 0, mild: 1, high: 2 } },
  { id: 'hrv-stress-select', key: 'stress', sev: { low: 0, mid: 1, high: 2 } },
  { id: 'hrv-mood-select', key: 'mood', sev: { good: 0, normal: 1, low: 2 } }
];

export class HrvController {
  static initialize(): void {
    document.getElementById('hrv-input')?.addEventListener('input', () => this.calculate());
    WELLNESS_SELECTS.forEach(({ id }) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => this.calculate());
      el?.addEventListener('change', () => this.calculate());
    });
    this.calculate();
  }

  /** Read the four subjective selects into severities (shared with Readiness). */
  static readWellness(): IWellnessInput {
    const out: IWellnessInput = {};
    WELLNESS_SELECTS.forEach(({ id, key, sev }) => {
      const v = (document.getElementById(id) as HTMLSelectElement | null)?.value || '';
      out[key] = v in sev ? sev[v] : undefined;
    });
    return out;
  }

  static calculate(): void {
    const statusEl = document.getElementById('hrv-status');
    if (!statusEl) return;
    const t = TranslationManager.getDict();
    const adviceEl = document.getElementById('hrv-advice');

    const raw = (document.getElementById('hrv-input') as HTMLInputElement | null)?.value || '';
    const rmssd = raw
      .split(/[\s,]+/)
      .map((s) => parseFloat(s))
      .filter((v) => isFinite(v));
    const r = HrvCalculator.analyze(rmssd);

    // HRV stat readouts + chart (only when there is a usable series).
    if (r) {
      set('hrv-baseline', String(r.baseline));
      set('hrv-today', String(r.today));
      set('hrv-band', `${r.lower}–${r.upper}`);
      set('hrv-cv', `${r.cv}%`);
      statusEl.textContent = t[`hrv_status_${r.status}`] || r.status;
      statusEl.className = `risk-badge risk-${STATUS_RISK[r.status]}`;
      if (adviceEl) adviceEl.textContent = t[`hrv_advice_${r.status}`] || '';
      renderInsight('hrv', {
        ok: true,
        chartHtml: sparkline({ points: rmssd, band: { lo: r.lower, hi: r.upper } })
      });
    } else {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      statusEl.textContent = '--';
      statusEl.className = '';
      if (adviceEl) adviceEl.textContent = '';
      renderInsight('hrv', { ok: false });
    }

    // Today's recommendation: HRV status (if any) blended with subjective wellness.
    const wellness = WellnessCalculator.score(this.readWellness());
    const rec = HrvCalculator.recommend(r?.status ?? null, wellness.score);
    const recEl = document.getElementById('hrv-recommendation');
    if (recEl) {
      if (rec.level) {
        const levelTxt = t[`hrv_rec_${rec.level}`] || rec.level;
        const note = rec.reason === 'saturation' ? ` ${t.hrv_rec_saturation_note || ''}` : '';
        recEl.innerHTML =
          `<span class="risk-badge risk-${REC_RISK[rec.level]}">${levelTxt}</span>` +
          (note ? `<span class="helper-text">${note}</span>` : '');
      } else {
        recEl.innerHTML = '';
      }
    }
  }
}

export default HrvController;
