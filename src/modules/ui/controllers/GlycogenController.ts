/**
 * GlycogenController
 * Wires the carb-loading UI (weight + protocol + race distance → daily
 * carbohydrate schedule, gated on the ≥90-min benefit threshold, plus a
 * pre-race top-up).
 */

import GlycogenCalculator from '../../core/GlycogenCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { barSeries } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import type { TGlycogenProtocol } from '../../core/GlycogenCalculator.js';

const PROTOCOLS: TGlycogenProtocol[] = ['modifiedSherman', 'classic', 'wa'];

export class GlycogenController {
  static initialize(): void {
    document
      .getElementById('glyco-weight-input')
      ?.addEventListener('input', () => this.calculate());
    document
      .getElementById('glyco-protocol-select')
      ?.addEventListener('change', () => this.calculate());
    document
      .getElementById('glyco-dist-select')
      ?.addEventListener('change', () => this.calculate());
    document.getElementById('glyco-time-input')?.addEventListener('input', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const schedule = document.getElementById('glyco-schedule');
    const loadEl = document.getElementById('glyco-load');
    if (!schedule || !loadEl) return;
    const setPre = (txt: string): void => {
      const el = document.getElementById('glyco-prerace');
      if (el) el.textContent = txt;
    };

    const weight = parseFloat(
      (document.getElementById('glyco-weight-input') as HTMLInputElement | null)?.value || ''
    );
    const sel = (document.getElementById('glyco-protocol-select') as HTMLSelectElement | null)
      ?.value;
    const protocol: TGlycogenProtocol = PROTOCOLS.includes(sel as TGlycogenProtocol)
      ? (sel as TGlycogenProtocol)
      : 'modifiedSherman';
    const distM =
      parseFloat(
        (document.getElementById('glyco-dist-select') as HTMLSelectElement | null)?.value || ''
      ) || undefined;
    // Optional goal finish time — overrides the distance-based duration estimate.
    const parsedTime = TimeFormatter.tryParse(
      (document.getElementById('glyco-time-input') as HTMLInputElement | null)?.value || ''
    );
    const goalSeconds = parsedTime && parsedTime > 0 ? parsedTime : undefined;

    if (!(weight > 0)) {
      loadEl.textContent = '--';
      schedule.innerHTML = '';
      setPre('');
      renderInsight('glyco', { ok: false });
      return;
    }

    const p = GlycogenCalculator.plan(weight, protocol, distM, goalSeconds);
    const t = TranslationManager.getDict();

    // Pre-race 1–4 h top-up applies to any race morning (Hawley & Burke 1997).
    setPre(
      TranslationManager.format('glyco_prerace', {
        lo: p.preRaceMeal.gramsLo,
        hi: p.preRaceMeal.gramsHi
      })
    );

    if (!p.needed) {
      // Event too short (< ~90 min) — loading is not beneficial (Burke 2011).
      loadEl.textContent = t.glyco_notneeded || '--';
      schedule.innerHTML = '';
      renderInsight('glyco', { ok: false });
      return;
    }

    loadEl.textContent = `${p.loadGperKg} g/kg · ${t.glyco_peak || 'peak'} ${p.peakCarbG} g`;
    schedule.innerHTML = p.days
      .map((d) => {
        const dayLabel = d.dayOffset === 0 ? t.glyco_raceday || 'Race day' : `D${d.dayOffset}`;
        const train = t[`glyco_train_${d.trainingKey}`] || d.trainingKey;
        return `<div class="fuel-row"><span>${dayLabel}</span><span>${d.carbGperKg} g/kg</span><span class="mono-text">${d.carbG} g</span><span>${train}</span></div>`;
      })
      .join('');

    renderInsight('glyco', {
      ok: true,
      // Daily carbohydrate staircase up to race day.
      chartHtml: barSeries(
        p.days.map((d) => ({
          label: d.dayOffset === 0 ? t.glyco_raceday || 'Race' : `D${d.dayOffset}`,
          value: d.carbG,
          caption: `${d.carbGperKg}`
        }))
      ),
      readoutText: TranslationManager.format('glyco_readout', {
        load: p.loadGperKg,
        peak: p.peakCarbG
      })
    });
  }
}

export default GlycogenController;
