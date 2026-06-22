/**
 * InputStore
 * Owns the transient mirror of the calculator input fields plus the last
 * computed pace. Previously these lived as mutable static fields on
 * UIController; extracting them lets the individual controllers share state
 * without UIController brokering it via callbacks.
 */

import { getDOMCache } from '../../../constants/domElements.js';

export class InputStore {
  private static values: Record<string, string> = {};
  private static lastPaceSecondsPerKm = 0;

  private static get dom() {
    return getDOMCache();
  }

  /** Read the current value of an input element by id. */
  static getInputValue(inputId: string): string {
    return (document.getElementById(inputId) as HTMLInputElement | null)?.value || '';
  }

  /** Snapshot the five calculator fields from the DOM into the cache. */
  static snapshot(): void {
    this.values = {
      pace_input: this.dom.inputs.paceMin?.value || '',
      pace_input2: this.dom.inputs.paceSec?.value || '',
      track_input: this.dom.inputs.track?.value || '',
      treadmill_input: this.dom.inputs.treadmill?.value || '',
      finish_time_input: this.dom.inputs.finishTime?.value || ''
    };
  }

  /** Set a single cached value (used while derived fields are updated). */
  static set(inputId: string, value: string): void {
    this.values[inputId] = value;
  }

  /** Return the cached input values (the object persisted to storage). */
  static getValues(): Record<string, string> {
    return this.values;
  }

  static setLastPace(seconds: number): void {
    this.lastPaceSecondsPerKm = seconds;
  }

  static getLastPace(): number {
    return this.lastPaceSecondsPerKm;
  }
}

export default InputStore;
