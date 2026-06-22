/**
 * MethodsController
 * Wires the named-coach training methods UI. Target marathon time → a key
 * workout for the chosen method (Yasso 800 / Norwegian 4×4 / Hansons /
 * Norwegian double threshold), with paces from the VDOT engine.
 */

import TrainingMethods, { type TTrainingMethodKey } from '../../core/TrainingMethods.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';

export class MethodsController {
  static initialize(): void {
    document
      .getElementById('methods-time-input')
      ?.addEventListener('input', () => this.calculate());
    document.getElementById('methods-select')?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const resultEl = document.getElementById('methods-result');
    const noteEl = document.getElementById('methods-note');
    if (!resultEl || !noteEl) return;

    const t = TranslationManager.getAll();
    const timeEl = document.getElementById('methods-time-input') as HTMLInputElement | null;
    const selEl = document.getElementById('methods-select') as HTMLSelectElement | null;

    const marathonSec = TimeFormatter.tryParse(timeEl?.value ?? '');
    if (marathonSec === null || marathonSec <= 0) {
      resultEl.innerHTML = '';
      noteEl.textContent = t.methods_need_time || '';
      return;
    }

    const method = (selEl?.value as TTrainingMethodKey) || 'yasso';
    const { vdot, paces } = TrainingMethods.pacesForMarathon(marathonSec);
    const pk = (sec: number) => `${TimeFormatter.format(sec)}/km`;

    let rows: [string, string, string][] = [];
    let note = '';

    if (method === 'yasso') {
      const rep = TrainingMethods.yasso800RepSeconds(marathonSec);
      rows = [['Y', t.method_yasso_work || '10 × 800m', TimeFormatter.format(rep)]];
      note = t.method_yasso_note || '';
    } else if (method === 'norwegian4x4') {
      rows = [['I', t.method_n4x4_work || '4 × 4 min', pk(paces.interval)]];
      note = t.method_n4x4_note || '';
    } else if (method === 'hansons') {
      rows = [
        ['T', t.method_hansons_tempo || 'Tempo @ marathon pace', pk(paces.marathon)],
        ['L', t.method_hansons_long || 'Long run', pk(paces.easy)]
      ];
      note = t.method_hansons_note || '';
    } else {
      rows = [
        ['AM', t.method_double_am || 'AM: 5 × 6 min @ T', pk(paces.threshold)],
        ['PM', t.method_double_pm || 'PM: 10 × 1 km @ T', pk(paces.threshold)]
      ];
      note = t.method_double_note || '';
    }

    resultEl.innerHTML = rows
      .map(
        ([badge, desc, value]) =>
          `<span class="zone-badge">${badge}</span><span>${desc}</span><span class="mono-text vdot-pace">${value}</span>`
      )
      .join('');
    noteEl.textContent = `VDOT ${vdot.toFixed(1)}${note ? ` · ${note}` : ''}`;
  }
}

export default MethodsController;
