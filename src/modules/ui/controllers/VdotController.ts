/**
 * VdotController
 * Wires the VDOT calculator UI (race result → VDOT, E/M/T/I/R paces and
 * equivalent race times). Pure calculation lives in VdotCalculator.
 */

import VdotCalculator from '../../core/VdotCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { zoneBar } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import type { IVdotPaces } from '../../../types/index';

const EQUIV_DISTANCES: { id: string; meters: number }[] = [
  { id: 'vdot-eq-5000', meters: 5000 },
  { id: 'vdot-eq-10000', meters: 10000 },
  { id: 'vdot-eq-21097', meters: 21097.5 },
  { id: 'vdot-eq-42195', meters: 42195 }
];

export class VdotController {
  static initialize(): void {
    const dist = document.getElementById('vdot-dist-select');
    const time = document.getElementById('vdot-time-input');
    dist?.addEventListener('change', () => this.calculate());
    time?.addEventListener('input', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const distEl = document.getElementById('vdot-dist-select') as HTMLSelectElement | null;
    const timeEl = document.getElementById('vdot-time-input') as HTMLInputElement | null;
    const valEl = document.getElementById('vdot-value');
    if (!distEl || !timeEl || !valEl) return;

    const distance = parseFloat(distEl.value);
    const seconds = TimeFormatter.tryParse(timeEl.value);
    if (seconds === null || seconds <= 0 || !(distance > 0)) {
      this.clear();
      return;
    }

    const vdot = VdotCalculator.vdotFromRace(distance, seconds);
    if (vdot <= 0) {
      this.clear();
      return;
    }

    valEl.textContent = vdot.toFixed(1);

    const paces: IVdotPaces = VdotCalculator.trainingPaces(vdot);
    this.setPace('vdot-pace-easy', paces.easy);
    this.setPace('vdot-pace-marathon', paces.marathon);
    this.setPace('vdot-pace-threshold', paces.threshold);
    this.setPace('vdot-pace-interval', paces.interval);
    this.setPace('vdot-pace-repetition', paces.repetition);

    EQUIV_DISTANCES.forEach(({ id, meters }) => {
      const el = document.getElementById(id);
      if (el) {
        const t = VdotCalculator.equivalentRaceTime(vdot, meters);
        el.textContent = t > 0 ? TimeFormatter.format(t) : '--';
      }
    });

    this.renderVdotInsight(vdot, paces);
  }

  /** Zone bar of the 5 paces + a plain-language interpretation of the VDOT. */
  private static renderVdotInsight(vdot: number, paces: IVdotPaces): void {
    const t = (k: string): string => TranslationManager.get(k);
    const pace = (s: number): string => (s > 0 ? TimeFormatter.format(s) : '--');
    const grade = t(`vdot_grade_${VdotCalculator.gradeFor(vdot)}`);
    renderInsight('vdot', {
      ok: true,
      chartHtml: zoneBar([
        { label: 'E', value: pace(paces.easy), caption: t('zone_easy_desc') },
        { label: 'M', value: pace(paces.marathon), caption: t('zone_marathon_desc') },
        { label: 'T', value: pace(paces.threshold), caption: t('zone_threshold_desc') },
        { label: 'I', value: pace(paces.interval), caption: t('zone_interval_desc') },
        { label: 'R', value: pace(paces.repetition), caption: t('zone_repetition_desc') }
      ]),
      readoutText: TranslationManager.format('vdot_readout', {
        v: vdot.toFixed(1),
        grade
      })
    });
  }

  private static setPace(id: string, seconds: number): void {
    const el = document.getElementById(id);
    if (el) el.textContent = seconds > 0 ? `${TimeFormatter.format(seconds)}/km` : '--';
  }

  private static clear(): void {
    const valEl = document.getElementById('vdot-value');
    if (valEl) valEl.textContent = '--';
    ['easy', 'marathon', 'threshold', 'interval', 'repetition'].forEach((k) => {
      const el = document.getElementById(`vdot-pace-${k}`);
      if (el) el.textContent = '--';
    });
    EQUIV_DISTANCES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '--';
    });
    renderInsight('vdot', { ok: false });
  }
}

export default VdotController;
