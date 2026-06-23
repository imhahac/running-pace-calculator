/**
 * AcwrController
 * Wires the injury-risk UI: four weekly-mileage inputs (oldest → this week) →
 * ACWR value, risk zone and a recommended next-week mileage range. Pure
 * calculation lives in AcwrCalculator.
 */

import AcwrCalculator from '../../core/AcwrCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

const WEEK_IDS = ['acwr-w1', 'acwr-w2', 'acwr-w3', 'acwr-w4'];
const OUTPUT_IDS = ['acwr-value', 'acwr-acute', 'acwr-chronic', 'acwr-rec'];

export class AcwrController {
  static initialize(): void {
    WEEK_IDS.forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const zoneEl = document.getElementById('acwr-zone');
    if (!zoneEl) return;

    const set = (id: string, value: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    const weekly = WEEK_IDS.map((id) =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '')
    );
    const r = AcwrCalculator.compute(weekly);

    if (!r) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      zoneEl.textContent = '--';
      zoneEl.className = '';
      renderInsight('acwr', { ok: false });
      return;
    }

    const t = TranslationManager.getDict();
    set('acwr-value', r.acwr.toFixed(2));
    set('acwr-acute', `${r.acute} km`);
    set('acwr-chronic', `${r.chronic} km`);
    set('acwr-rec', `${r.recommendedNextWeekMin}–${r.recommendedNextWeekMax} km`);
    const zoneLabel = t[`acwr_zone_${r.zone}`] || r.zone;
    zoneEl.textContent = zoneLabel;
    zoneEl.className = `risk-badge risk-${r.zone === 'sweet' ? 'low' : r.zone === 'caution' ? 'high' : r.zone === 'highrisk' ? 'extreme' : 'moderate'}`;

    renderInsight('acwr', {
      ok: true,
      chartHtml: gauge({
        value: r.acwr,
        min: 0,
        max: 2,
        valueLabel: r.acwr.toFixed(2),
        bands: [
          { upTo: 0.8, cls: 'warn' },
          { upTo: 1.3, cls: 'good' },
          { upTo: 1.5, cls: 'warn' },
          { upTo: 2, cls: 'bad' }
        ]
      }),
      readoutText: TranslationManager.format('acwr_readout', {
        acwr: r.acwr.toFixed(2),
        zone: zoneLabel,
        min: r.recommendedNextWeekMin,
        max: r.recommendedNextWeekMax
      })
    });
  }
}

export default AcwrController;
