/**
 * PredictionController
 * Riegel race-time predictor. Self-contained: reads its own two inputs and
 * writes into the prediction display cells.
 */

import { getDOMCache } from '../../../constants/domElements.js';
import { HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../../../constants/index.js';
import TimeFormatter from '../../core/TimeFormatter.js';

export class PredictionController {
  private static get dom() {
    return getDOMCache();
  }

  static calculatePrediction(): void {
    const predDistSelect = document.getElementById('pred-dist-select') as HTMLSelectElement;
    const predTimeInput = document.getElementById('pred-time-input') as HTMLInputElement;
    if (!predDistSelect || !predTimeInput) return;

    const dist = parseFloat(predDistSelect.value);
    const timeStr = predTimeInput.value;
    const timeSec = TimeFormatter.parse(timeStr);
    const p = this.dom.displays.prediction;
    const setEl = (el: HTMLElement | null, val: string) => {
      if (el) el.textContent = val;
    };

    if (!dist || !timeSec) {
      setEl(p.k5, '--');
      setEl(p.k10, '--');
      setEl(p.half, '--');
      setEl(p.full, '--');
      return;
    }

    // T2 = T1 * (D2 / D1)^1.06 (Riegel's formula)
    const predict = (d2: number): string =>
      TimeFormatter.format(timeSec * Math.pow(d2 / dist, 1.06));

    setEl(p.k5, predict(5000));
    setEl(p.k10, predict(10000));
    setEl(p.half, predict(HALF_MARATHON_METERS));
    setEl(p.full, predict(FULL_MARATHON_METERS));
  }
}

export default PredictionController;
