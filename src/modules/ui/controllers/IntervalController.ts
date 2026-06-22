/**
 * IntervalController
 * Wires the interval workout generator. Reuses the VDOT race inputs (shared
 * with the VDOT card) plus a weekly-mileage + type selector, and renders the
 * structured session from IntervalBuilder.
 */

import IntervalBuilder from '../../core/IntervalBuilder.js';
import VdotCalculator from '../../core/VdotCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';

export class IntervalController {
  static initialize(): void {
    [
      'vdot-dist-select',
      'vdot-time-input',
      'interval-weekly-input',
      'interval-type-select'
    ].forEach((id) => {
      const el = document.getElementById(id);
      const evt = el && el.tagName === 'SELECT' ? 'change' : 'input';
      el?.addEventListener(evt, () => this.calculate());
    });
    this.calculate();
  }

  static calculate(): void {
    const resultEl = document.getElementById('interval-result');
    const noteEl = document.getElementById('interval-note');
    if (!resultEl || !noteEl) return;

    const t = TranslationManager.getAll();
    const distEl = document.getElementById('vdot-dist-select') as HTMLSelectElement | null;
    const timeEl = document.getElementById('vdot-time-input') as HTMLInputElement | null;
    const weeklyEl = document.getElementById('interval-weekly-input') as HTMLInputElement | null;
    const typeEl = document.getElementById('interval-type-select') as HTMLSelectElement | null;

    const distance = parseFloat(distEl?.value || '');
    const seconds = TimeFormatter.tryParse(timeEl?.value ?? '');
    if (seconds === null || seconds <= 0 || !(distance > 0)) {
      resultEl.innerHTML = '';
      noteEl.textContent = t.interval_need_vdot || '';
      return;
    }

    const vdot = VdotCalculator.vdotFromRace(distance, seconds);
    const weekly = parseFloat(weeklyEl?.value || '') || 0;
    const type = (typeEl?.value === 'T' ? 'T' : typeEl?.value === 'R' ? 'R' : 'I') as
      | 'I'
      | 'T'
      | 'R';
    const s = IntervalBuilder.build(vdot, weekly, type);
    if (!s) {
      resultEl.innerHTML = '';
      noteEl.textContent = t.interval_need_vdot || '';
      return;
    }

    const pace = `${TimeFormatter.format(s.repPaceSec)}/km`;
    const rows = [
      ['WU', t.interval_warmup || 'Warm-up', `${s.warmupKm} km`],
      [s.type, `${s.reps}×${s.repMeters}m @ ${pace} (${s.restDesc})`, `${s.mainKm.toFixed(1)} km`],
      ['CD', t.interval_cooldown || 'Cool-down', `${s.cooldownKm} km`]
    ];
    resultEl.innerHTML = rows
      .map(
        ([badge, desc, amount]) =>
          `<span class="zone-badge">${badge}</span><span>${desc}</span><span class="mono-text vdot-pace">${amount}</span>`
      )
      .join('');

    const totalMin = Math.round(s.totalSec / 60);
    const totalLabel = `${t.interval_total || 'Total'}: ${s.totalKm.toFixed(1)} km · ~${totalMin} min`;
    noteEl.textContent = s.cappedByWeekly
      ? `${totalLabel} · ${t.interval_capped || ''}`
      : totalLabel;
  }
}

export default IntervalController;
