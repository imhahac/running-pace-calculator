/**
 * AltitudeController
 * Wires the altitude-training UI: altitude, days, hours/day and protocol →
 * exposure hours, estimated Hb-mass / VO₂max gains and an adequacy verdict.
 */

import AltitudeCalculator from '../../core/AltitudeCalculator.js';
import TranslationManager from '../../state/TranslationManager.js';
import type { TAltProtocol } from '../../core/AltitudeCalculator.js';

const PROTOCOLS: TAltProtocol[] = ['LHTL', 'LHTH', 'IHE'];
const OUTPUT_IDS = ['alt-hours', 'alt-hbmass', 'alt-vo2'];

export class AltitudeController {
  static initialize(): void {
    ['alt-altitude-input', 'alt-days-input', 'alt-hours-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.calculate())
    );
    document
      .getElementById('alt-protocol-select')
      ?.addEventListener('change', () => this.calculate());
    this.calculate();
  }

  static calculate(): void {
    const statusEl = document.getElementById('alt-status');
    if (!statusEl) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');

    const altitude = num('alt-altitude-input');
    const days = num('alt-days-input');
    const hours = num('alt-hours-input');
    const sel = (document.getElementById('alt-protocol-select') as HTMLSelectElement | null)?.value;
    const protocol: TAltProtocol = PROTOCOLS.includes(sel as TAltProtocol)
      ? (sel as TAltProtocol)
      : 'LHTL';

    const r = AltitudeCalculator.analyze(altitude, days, hours, protocol);
    if (!r) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      statusEl.textContent = '--';
      statusEl.className = '';
      return;
    }

    const t = TranslationManager.getAll();
    set('alt-hours', `${r.totalHours} h`);
    set('alt-hbmass', `+${r.hbMassGainPct}%`);
    set('alt-vo2', `+${r.vo2GainPct}%`);

    const statusKey = !r.altitudeOk ? 'lowalt' : !r.hoursOk ? 'lowhours' : 'good';
    statusEl.textContent = t[`alt_status_${statusKey}`] || statusKey;
    statusEl.className = `risk-badge risk-${statusKey === 'good' ? 'low' : 'moderate'}`;
  }
}

export default AltitudeController;
