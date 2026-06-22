/**
 * TrainingMethods Module
 * Named coach methods that derive a key workout from a target marathon time.
 * Yasso 800 has its own rule of thumb; the others are expressed via Daniels
 * VDOT paces. Pure and DOM-free; the controller localizes the labels.
 */

import VdotCalculator from './VdotCalculator.js';
import { FULL_MARATHON_METERS } from '../../constants/index.js';
import type { IVdotPaces } from '../../types/index';

export type TTrainingMethodKey = 'yasso' | 'norwegian4x4' | 'hansons' | 'doubleThreshold';

export class TrainingMethods {
  /**
   * Yasso 800 rule of thumb: a marathon of H hours : M minutes corresponds to
   * 800m repeats run in M(H) minutes : S(M) seconds. e.g. 3:30 marathon →
   * 800m in 3:30 (210s).
   */
  static yasso800RepSeconds(marathonSeconds: number): number {
    if (!(marathonSeconds > 0)) return 0;
    const hours = Math.floor(marathonSeconds / 3600);
    const minutes = Math.floor((marathonSeconds % 3600) / 60);
    return hours * 60 + minutes;
  }

  /** VDOT and E/M/T/I/R paces implied by a target marathon time. */
  static pacesForMarathon(marathonSeconds: number): { vdot: number; paces: IVdotPaces } {
    const vdot = VdotCalculator.vdotFromRace(FULL_MARATHON_METERS, marathonSeconds);
    return { vdot, paces: VdotCalculator.trainingPaces(vdot) };
  }
}

export default TrainingMethods;
