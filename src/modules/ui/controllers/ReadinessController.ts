/**
 * ReadinessController
 * Integrated daily training-readiness dashboard. It has NO inputs of its own —
 * it reads the existing ACWR / HRV / Recovery tool fields, runs their
 * calculators, and synthesises a single readiness via ReadinessCalculator. Any
 * tool left blank simply contributes 'n/a' (the score uses whatever is present).
 */

import AcwrCalculator from '../../core/AcwrCalculator.js';
import HrvCalculator from '../../core/HrvCalculator.js';
import RecoveryCalculator from '../../core/RecoveryCalculator.js';
import ReadinessCalculator from '../../core/ReadinessCalculator.js';
import WellnessCalculator from '../../core/WellnessCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';
import { gauge } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';
import { setText, pickOption } from './dom.js';
import HrvController from './HrvController.js';
import type { TEffort } from '../../core/RecoveryCalculator.js';

// The existing tool inputs this dashboard reads from (re-renders on their change).
const SOURCE_IDS = [
  'acwr-w1',
  'acwr-w2',
  'acwr-w3',
  'acwr-w4',
  'hrv-input',
  'hrv-sleep-select',
  'hrv-soreness-select',
  'hrv-stress-select',
  'hrv-mood-select',
  'rec-dist-select',
  'rec-effort-select',
  'rec-age-input',
  'rec-time-input'
];
const EFFORTS: TEffort[] = ['easy', 'moderate', 'hard', 'allout'];
const STATE_ICON: Record<string, string> = { good: '🟢', ok: '🟡', bad: '🔴', na: '—' };

export class ReadinessController {
  static initialize(): void {
    SOURCE_IDS.forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => this.calculate());
      el?.addEventListener('change', () => this.calculate());
    });
    this.calculate();
  }

  private static acwrZone() {
    const weekly = ['acwr-w1', 'acwr-w2', 'acwr-w3', 'acwr-w4'].map((id) =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '')
    );
    return AcwrCalculator.compute(weekly)?.zone ?? null;
  }

  private static hrvStatus() {
    const raw = (document.getElementById('hrv-input') as HTMLInputElement | null)?.value || '';
    const nums = (raw.match(/[\d.]+/g) || []).map(Number).filter((n) => isFinite(n) && n > 0);
    return HrvCalculator.analyze(nums)?.status ?? null;
  }

  private static recoveryDays(): number | null {
    const distM = parseFloat(
      (document.getElementById('rec-dist-select') as HTMLSelectElement | null)?.value || ''
    );
    if (!(distM > 0)) return null; // no race chosen → recovery factor is n/a
    const effort = pickOption(
      (document.getElementById('rec-effort-select') as HTMLSelectElement | null)?.value,
      EFFORTS,
      'hard'
    );
    const age =
      parseFloat(
        (document.getElementById('rec-age-input') as HTMLInputElement | null)?.value || ''
      ) || 35;
    const finish = TimeFormatter.tryParse(
      (document.getElementById('rec-time-input') as HTMLInputElement | null)?.value || ''
    );
    return RecoveryCalculator.recovery(distM / 1000, effort, age, finish ?? undefined)
      .beforeHardDays;
  }

  /** Subjective wellness 0–100 from the HRV card's four selects (shared reader). */
  private static wellnessScore(): number | null {
    return WellnessCalculator.score(HrvController.readWellness()).score;
  }

  static calculate(): void {
    if (!document.getElementById('readiness-chart')) return;
    const t = TranslationManager.getDict();
    const result = ReadinessCalculator.compute({
      hrvStatus: this.hrvStatus(),
      acwrZone: this.acwrZone(),
      recoveryDays: this.recoveryDays(),
      wellnessScore: this.wellnessScore()
    });

    const factorsEl = document.getElementById('readiness-factors');
    if (factorsEl) {
      factorsEl.innerHTML = result.factors
        .map((f) => {
          const name = t[`readiness_factor_${f.key}`] || f.key;
          const state =
            f.state === 'na' ? t.readiness_na || 'n/a' : t[`readiness_state_${f.state}`] || f.state;
          return (
            `<span class="zone-badge">${STATE_ICON[f.state]}</span><span>${name}</span>` +
            `<span class="mono-text vdot-pace">${state}</span>`
          );
        })
        .join('');
    }

    if (result.score === null || result.level === null) {
      setText('readiness-level', t.readiness_none || '');
      renderInsight('readiness', { ok: false });
      return;
    }
    const levelLabel = t[`readiness_level_${result.level}`] || result.level;
    setText('readiness-level', `${result.score} · ${levelLabel}`);
    renderInsight('readiness', {
      ok: true,
      chartHtml: gauge({
        value: result.score,
        min: 0,
        max: 100,
        valueLabel: String(result.score),
        bands: [
          { upTo: 40, cls: 'bad' },
          { upTo: 60, cls: 'warn' },
          { upTo: 100, cls: 'good' }
        ]
      }),
      readoutText: TranslationManager.format('readiness_readout', {
        score: result.score,
        level: levelLabel
      })
    });
  }
}

export default ReadinessController;
