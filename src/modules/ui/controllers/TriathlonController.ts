import TimeFormatter from '../../core/TimeFormatter.js';
import TriathlonCalculator from '../../core/TriathlonCalculator.js';
import StateManager from '../../state/StateManager.js';

export class TriathlonController {
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
  }
}

export default TriathlonController;
