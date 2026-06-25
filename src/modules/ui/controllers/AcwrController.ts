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
import { setText as set } from './dom.js';

const WEEK_IDS = ['acwr-w1', 'acwr-w2', 'acwr-w3', 'acwr-w4'];
const OUTPUT_IDS = ['acwr-value', 'acwr-acute', 'acwr-chronic', 'acwr-rec'];

export class AcwrController {
  static initialize(): void {
    WEEK_IDS.forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    ['acwr-strength', 'acwr-shoes'].forEach((id) =>
      document.getElementById(id)?.addEventListener('change', () => this.calculate())
    );
    this.calculate();
  }

  static calculate(): void {
    const zoneEl = document.getElementById('acwr-zone');
    if (!zoneEl) return;

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

    // Protective-factor toggles → injury-risk magnitude + tailored advice.
    const strengthTraining =
      (document.getElementById('acwr-strength') as HTMLSelectElement | null)?.value === 'yes';
    const shoeRotation =
      (document.getElementById('acwr-shoes') as HTMLSelectElement | null)?.value === 'yes';
    const risk = AcwrCalculator.riskContext({
      acwr: r.acwr,
      zone: r.zone,
      strengthTraining,
      shoeRotation
    });
    const readoutText = [
      TranslationManager.format('acwr_readout', {
        acwr: r.acwr.toFixed(2),
        zone: zoneLabel,
        min: r.recommendedNextWeekMin,
        max: r.recommendedNextWeekMax
      }),
      t[`acwr_mag_${risk.magnitudeKey}`] || '',
      ...risk.protectiveKeys.map((k) => t[`acwr_protect_${k}`] || '')
    ]
      .filter(Boolean)
      .join(' ');

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
      readoutText
    });
  }
}

export default AcwrController;
