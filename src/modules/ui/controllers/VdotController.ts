/**
 * VdotController
 * Wires the VDOT calculator UI (race result → VDOT, E/M/T/I/R paces and
 * equivalent race times). Pure calculation lives in VdotCalculator.
 */

import VdotCalculator from '../../core/VdotCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import type { IVdotPaces } from '../../../types/index';

const EQUIV_DISTANCES: { id: string; meters: number }[] = [
  { id: 'vdot-eq-5000', meters: 5000 },
  { id: 'vdot-eq-10000', meters: 10000 },
  { id: 'vdot-eq-21097', meters: 21097.5 },
  { id: 'vdot-eq-42195', meters: 42195 }
];

export class VdotController {
  static initialize(): void {
    const dist = document.getElementById('vdot-dist-select');
    const time = document.getElementById('vdot-time-input');
    dist?.addEventListener('change', () => this.calculate());
    time?.addEventListener('input', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const distEl = document.getElementById('vdot-dist-select') as HTMLSelectElement | null;
    const timeEl = document.getElementById('vdot-time-input') as HTMLInputElement | null;
    const valEl = document.getElementById('vdot-value');
    if (!distEl || !timeEl || !valEl) return;

    const distance = parseFloat(distEl.value);
    const seconds = TimeFormatter.tryParse(timeEl.value);
    if (seconds === null || seconds <= 0 || !(distance > 0)) {
      this.clear();
      return;
    }

    const vdot = VdotCalculator.vdotFromRace(distance, seconds);
    if (vdot <= 0) {
      this.clear();
      return;
    }

    valEl.textContent = vdot.toFixed(1);

    const paces: IVdotPaces = VdotCalculator.trainingPaces(vdot);
    this.setPace('vdot-pace-easy', paces.easy);
    this.setPace('vdot-pace-marathon', paces.marathon);
    this.setPace('vdot-pace-threshold', paces.threshold);
    this.setPace('vdot-pace-interval', paces.interval);
    this.setPace('vdot-pace-repetition', paces.repetition);

    EQUIV_DISTANCES.forEach(({ id, meters }) => {
      const el = document.getElementById(id);
      if (el) {
        const t = VdotCalculator.equivalentRaceTime(vdot, meters);
        el.textContent = t > 0 ? TimeFormatter.format(t) : '--';
      }
    });
  }

  private static setPace(id: string, seconds: number): void {
    const el = document.getElementById(id);
    if (el) el.textContent = seconds > 0 ? `${TimeFormatter.format(seconds)}/km` : '--';
  }

  private static clear(): void {
    const valEl = document.getElementById('vdot-value');
    if (valEl) valEl.textContent = '--';
    ['easy', 'marathon', 'threshold', 'interval', 'repetition'].forEach((k) => {
      const el = document.getElementById(`vdot-pace-${k}`);
      if (el) el.textContent = '--';
    });
    EQUIV_DISTANCES.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '--';
    });
  }
}

export default VdotController;
