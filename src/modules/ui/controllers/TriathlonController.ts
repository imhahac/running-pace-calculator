import TimeFormatter from '../../core/TimeFormatter.js';
import TriathlonCalculator from '../../core/TriathlonCalculator.js';
import StateManager from '../../state/StateManager.js';
import TranslationManager from '../../state/TranslationManager.js';
import { phaseStrip } from '../viz/Charts.js';
import { renderInsight } from '../viz/ToolInsight.js';

export class TriathlonController {
  /** Re-render on language change (alias for DYNAMIC_VIEWS). */
  static calculate(): void {
    this.calculateTriathlon(false);
  }
  static initBindings() {
    const triDistSelect = document.getElementById('tri-dist-select');
    const triTotalInput = document.getElementById('tri-total-input');
    const triSwimInput = document.getElementById('tri-swim-input');
    const triBikeInput = document.getElementById('tri-bike-input');
    const triRunInput = document.getElementById('tri-run-input');

    if (triDistSelect)
      triDistSelect.addEventListener('change', () => this.calculateTriathlon(false));
    if (triTotalInput)
      triTotalInput.addEventListener('change', () => this.calculateTriathlon(true));
    if (triSwimInput) triSwimInput.addEventListener('input', () => this.calculateTriathlon(false));
    // T1 is usually small, so blur or change might be better, but matching original behavior
    const triT1Input = document.getElementById('tri-t1-input');
    if (triT1Input) triT1Input.addEventListener('input', () => this.calculateTriathlon(false));

    if (triBikeInput) triBikeInput.addEventListener('input', () => this.calculateTriathlon(false));

    const triT2Input = document.getElementById('tri-t2-input');
    if (triT2Input) triT2Input.addEventListener('input', () => this.calculateTriathlon(false));

    if (triRunInput) triRunInput.addEventListener('input', () => this.calculateTriathlon(false));
  }

  static calculateTriathlon(fromTotal: boolean): void {
    const distSelect = document.getElementById('tri-dist-select') as HTMLSelectElement | null;
    const totalInput = document.getElementById('tri-total-input') as HTMLInputElement | null;
    const swimInput = document.getElementById('tri-swim-input') as HTMLInputElement | null;
    const t1Input = document.getElementById('tri-t1-input') as HTMLInputElement | null;
    const bikeInput = document.getElementById('tri-bike-input') as HTMLInputElement | null;
    const t2Input = document.getElementById('tri-t2-input') as HTMLInputElement | null;
    const runInput = document.getElementById('tri-run-input') as HTMLInputElement | null;
    const display = document.getElementById('tri-total-display');

    if (
      !distSelect ||
      !display ||
      !totalInput ||
      !swimInput ||
      !t1Input ||
      !bikeInput ||
      !t2Input ||
      !runInput
    )
      return;

    const distKey = parseFloat(distSelect.value) as 51.5 | 113 | 226;

    if (fromTotal) {
      const totalSec = TimeFormatter.parse(totalInput.value);
      if (!totalSec) return;

      const res = TriathlonCalculator.calculateFromTargetTime(distKey, totalSec);

      swimInput.value = TimeFormatter.format(res.swimPacePer100m, false);
      t1Input.value = TimeFormatter.format(res.t1, false);
      bikeInput.value = res.bikeKmh.toFixed(1);
      t2Input.value = TimeFormatter.format(res.t2, false);
      runInput.value = TimeFormatter.format(res.runPacePerKm, false);

      display.textContent = TimeFormatter.format(totalSec, true);
    } else {
      const swimPace = TimeFormatter.parse(swimInput.value) || 0;
      const t1 = TimeFormatter.parse(t1Input.value) || 0;
      const bikeKmh = parseFloat(bikeInput.value) || 0;
      const t2 = TimeFormatter.parse(t2Input.value) || 0;
      const runPace = TimeFormatter.parse(runInput.value) || 0;

      const res = TriathlonCalculator.calculateFromPaces(distKey, {
        swimPacePer100m: swimPace,
        t1,
        bikeKmh,
        t2,
        runPacePerKm: runPace
      });

      display.textContent =
        res.totalTime > 0 ? TimeFormatter.format(res.totalTime, true) : '--:--:--';
    }

    StateManager.setTriInputs({
      totalTarget: totalInput.value,
      swim: swimInput.value,
      t1: t1Input.value,
      bike: bikeInput.value,
      t2: t2Input.value,
      run: runInput.value
    });

    this.renderTriInsight(distKey, {
      swimPacePer100m: TimeFormatter.parse(swimInput.value) || 0,
      t1: TimeFormatter.parse(t1Input.value) || 0,
      bikeKmh: parseFloat(bikeInput.value) || 0,
      t2: TimeFormatter.parse(t2Input.value) || 0,
      runPacePerKm: TimeFormatter.parse(runInput.value) || 0
    });
  }

  /** Segment-time split strip + a plain-language readout. */
  private static renderTriInsight(
    distKey: 51.5 | 113 | 226,
    inputs: {
      swimPacePer100m: number;
      t1: number;
      bikeKmh: number;
      t2: number;
      runPacePerKm: number;
    }
  ): void {
    const res = TriathlonCalculator.calculateFromPaces(distKey, inputs);
    if (!(res.totalTime > 0)) {
      renderInsight('tri', { ok: false });
      return;
    }

    const t = TranslationManager.getDict();
    const fmt = (s: number): string => TimeFormatter.format(s, true);
    renderInsight('tri', {
      ok: true,
      chartHtml: phaseStrip([
        { label: t.tri_seg_swim || 'Swim', weight: res.swimTime, caption: fmt(res.swimTime) },
        { label: 'T1', weight: inputs.t1, caption: fmt(inputs.t1), cls: 'z2' },
        {
          label: t.tri_seg_bike || 'Bike',
          weight: res.bikeTime,
          caption: fmt(res.bikeTime),
          cls: 'z5'
        },
        { label: 'T2', weight: inputs.t2, caption: fmt(inputs.t2), cls: 'z2' },
        { label: t.tri_seg_run || 'Run', weight: res.runTime, caption: fmt(res.runTime), cls: 'z4' }
      ]),
      readoutText: TranslationManager.format('tri_readout', {
        total: fmt(res.totalTime),
        swim: fmt(res.swimTime),
        bike: fmt(res.bikeTime),
        run: fmt(res.runTime)
      })
    });
  }
}

export default TriathlonController;
