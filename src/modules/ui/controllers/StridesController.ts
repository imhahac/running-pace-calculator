/**
 * StridesController
 * Wires the strides UI: a progression week (1–12) → that week's stride session,
 * plus the full 12-week progression. Stride pace is the repetition (R) pace
 * derived from the shared VDOT race inputs (when a result is entered). Pure
 * logic lives in StridesBuilder.
 */

import StridesBuilder from '../../core/StridesBuilder.js';
import VdotCalculator from '../../core/VdotCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { barSeries } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

export class StridesController {
  static initialize(): void {
    ['strides-week-input', 'vdot-dist-select', 'vdot-time-input'].forEach((id) => {
      const el = document.getElementById(id);
      const evt = el && el.tagName === 'SELECT' ? 'change' : 'input';
      el?.addEventListener(evt, () => this.calculate());
    });
    this.calculate();
  }

  static calculate(): void {
    const sessionEl = document.getElementById('strides-session');
    const gridEl = document.getElementById('strides-progression');
    if (!sessionEl || !gridEl) return;

    const t = TranslationManager.getDict();
    const week = parseInt(
      (document.getElementById('strides-week-input') as HTMLInputElement | null)?.value || '1',
      10
    );

    // Stride pace = repetition (R) pace from VDOT (shared race inputs).
    const distEl = document.getElementById('vdot-dist-select') as HTMLSelectElement | null;
    const timeEl = document.getElementById('vdot-time-input') as HTMLInputElement | null;
    const distance = parseFloat(distEl?.value || '');
    const seconds = TimeFormatter.tryParse(timeEl?.value ?? '');
    const vdot =
      seconds !== null && seconds > 0 && distance > 0
        ? VdotCalculator.vdotFromRace(distance, seconds)
        : 0;
    const repPaceSec = vdot > 0 ? VdotCalculator.trainingPaces(vdot).repetition : undefined;

    const s = StridesBuilder.session(isFinite(week) ? week : 1, repPaceSec);
    const recLabel = t.strides_recovery || 'recovery';
    if (s.repPaceSec && s.distancePerStrideM) {
      sessionEl.textContent = `${s.reps} × ${s.durationSec}s @ ${TimeFormatter.format(s.repPaceSec)}/km (~${s.distancePerStrideM}m) · ${recLabel} ~${s.recoverySec}s`;
    } else {
      sessionEl.textContent = `${s.reps} × ${s.durationSec}s · ${recLabel} ~${s.recoverySec}s · ${t.strides_need_vdot || ''}`;
    }

    const progression = StridesBuilder.progression(repPaceSec);
    gridEl.innerHTML = progression
      .map((p) => {
        const pacePart = p.repPaceSec ? ` @ ${TimeFormatter.format(p.repPaceSec)}` : '';
        return `<span class="zone-badge">${p.week}</span><span>${p.reps} × ${p.durationSec}s${pacePart}</span><span class="mono-text vdot-pace">~${p.recoverySec}s</span>`;
      })
      .join('');

    // 12-week progression as total stride seconds per week (reps × duration).
    renderInsight('strides', {
      ok: true,
      chartHtml: barSeries(
        progression.map((p) => ({
          label: `${p.week}`,
          value: p.reps * p.durationSec,
          caption: `${p.reps}×${p.durationSec}s`
        }))
      )
    });
  }
}

export default StridesController;
