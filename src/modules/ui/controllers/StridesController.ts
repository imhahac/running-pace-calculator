/**
 * StridesController
 * Wires the strides UI: a progression week (1–12) → that week's stride session,
 * plus the full 12-week progression. Pure logic lives in StridesBuilder.
 */

import StridesBuilder from '../../core/StridesBuilder.js';
import TranslationManager from '../../state/TranslationManager.js';
import { barSeries } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

export class StridesController {
  static initialize(): void {
    document
      .getElementById('strides-week-input')
      ?.addEventListener('input', () => this.calculate());
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
    const s = StridesBuilder.session(isFinite(week) ? week : 1);

    const recLabel = t.strides_recovery || 'recovery';
    sessionEl.textContent = `${s.reps} × ${s.durationSec}s · ${recLabel} ~${s.recoverySec}s`;

    const progression = StridesBuilder.progression();
    gridEl.innerHTML = progression
      .map(
        (p) =>
          `<span class="zone-badge">${p.week}</span><span>${p.reps} × ${p.durationSec}s</span><span class="mono-text vdot-pace">~${p.recoverySec}s</span>`
      )
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
