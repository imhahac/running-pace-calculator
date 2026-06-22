/**
 * RacePlanController
 * Wires the race-pace planner: distance + target time + strategy → summary
 * metrics and a per-kilometer split table (from RacePlanBuilder).
 */

import RacePlanBuilder from '../../core/RacePlanBuilder.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { TRaceStrategy } from '../../../types/index';

export class RacePlanController {
  static initialize(): void {
    ['raceplan-dist-select', 'raceplan-time-input', 'raceplan-strategy-select'].forEach((id) => {
      const el = document.getElementById(id);
      const evt = el && el.tagName === 'SELECT' ? 'change' : 'input';
      el?.addEventListener(evt, () => this.calculate());
    });
    this.calculate();
  }

  static calculate(): void {
    const summaryEl = document.getElementById('raceplan-summary');
    const tableEl = document.getElementById('raceplan-table');
    if (!summaryEl || !tableEl) return;

    const t = TranslationManager.getAll();
    const distEl = document.getElementById('raceplan-dist-select') as HTMLSelectElement | null;
    const timeEl = document.getElementById('raceplan-time-input') as HTMLInputElement | null;
    const stratEl = document.getElementById('raceplan-strategy-select') as HTMLSelectElement | null;

    const distance = parseFloat(distEl?.value || '');
    const seconds = TimeFormatter.tryParse(timeEl?.value ?? '');
    if (seconds === null || seconds <= 0 || !(distance > 0)) {
      summaryEl.textContent = '';
      tableEl.innerHTML = '';
      return;
    }

    const strategy = (stratEl?.value as TRaceStrategy) || 'even';
    const plan = RacePlanBuilder.build(distance, seconds, strategy);
    if (plan.rows.length === 0) {
      summaryEl.textContent = '';
      tableEl.innerHTML = '';
      return;
    }

    summaryEl.textContent =
      `${t.raceplan_avg || 'Avg'} ${TimeFormatter.format(plan.avgPaceSec)}/km · ` +
      `${plan.avgSpeedKmh.toFixed(1)} km/h · VDOT ${plan.vdot.toFixed(1)}`;

    const phaseLabel: Record<string, string> = {
      start: t.phase_start || 'start',
      mid: t.phase_mid || 'mid',
      surge: t.phase_surge || 'surge',
      finish: t.phase_finish || 'finish'
    };
    const head = `<div class="raceplan-row raceplan-head"><span>${t.col_km || 'km'}</span><span>${t.col_pace || 'pace'}</span><span>${t.col_time || 'time'}</span><span>${t.col_phase || 'phase'}</span></div>`;
    const body = plan.rows
      .map((r) => {
        const km = Number.isInteger(r.km) ? `${r.km}` : r.km.toFixed(2);
        return `<div class="raceplan-row"><span>${km}</span><span class="mono-text">${TimeFormatter.format(r.paceSec)}</span><span class="mono-text">${TimeFormatter.format(r.cumulativeSec)}</span><span>${phaseLabel[r.phase]}</span></div>`;
      })
      .join('');
    tableEl.innerHTML = head + body;
  }
}

export default RacePlanController;
