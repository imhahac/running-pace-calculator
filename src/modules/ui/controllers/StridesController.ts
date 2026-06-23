/**
 * StridesController
 * Wires the strides UI: a progression week (1–12) → that week's stride session,
 * plus the full 12-week progression. Pure logic lives in StridesBuilder.
 */

import StridesBuilder from '../../core/StridesBuilder.js';
import TranslationManager from '../../state/TranslationManager.js';

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

    const t = TranslationManager.getAll();
    const week = parseInt(
      (document.getElementById('strides-week-input') as HTMLInputElement | null)?.value || '1',
      10
    );
    const s = StridesBuilder.session(isFinite(week) ? week : 1);

    const recLabel = t.strides_recovery || 'recovery';
    sessionEl.textContent = `${s.reps} × ${s.durationSec}s · ${recLabel} ~${s.recoverySec}s`;

    gridEl.innerHTML = StridesBuilder.progression()
      .map(
        (p) =>
          `<span class="zone-badge">${p.week}</span><span>${p.reps} × ${p.durationSec}s</span><span class="mono-text vdot-pace">~${p.recoverySec}s</span>`
      )
      .join('');
  }
}

export default StridesController;
