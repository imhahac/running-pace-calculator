/**
 * GapController
 * Wires the GPX route GAP-analysis UI: upload a GPX file + a flat-ground target
 * pace → total distance/ascent/descent, predicted route pace, an inline SVG
 * elevation profile and a per-km grade-adjusted pace table. Self-contained
 * (own elevation profile) so it never touches the shared race-route map.
 */

import GapCalculator from '../../core/GapCalculator.js';
import HeartRateCalculator from '../../core/HeartRateCalculator.js';
import TimeFormatter from '../../core/TimeFormatter.js';
import TranslationManager from '../../state/TranslationManager.js';

const OUTPUT_IDS = ['gap-totaldist', 'gap-ascent', 'gap-descent', 'gap-predicted', 'gap-hr-band'];
const FIRST_FUEL_SEC = 2700; // first fuel at ~45 min
const FUEL_INTERVAL_SEC = 1800; // then every ~30 min

export class GapController {
  private static lastText = '';

  static initialize(): void {
    document.getElementById('gap-file-input')?.addEventListener('change', (e) => this.onFile(e));
    ['gap-pace-input', 'gap-maxhr-input', 'gap-resthr-input'].forEach((id) =>
      document.getElementById(id)?.addEventListener('input', () => this.render())
    );
  }

  private static onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (): void => this.renderFromText(String(reader.result || ''));
    reader.readAsText(file);
  }

  /** Public entry so the file reader (and tests) can drive rendering. */
  static renderFromText(text: string): void {
    this.lastText = text;
    this.render();
  }

  static render(): void {
    const splitsEl = document.getElementById('gap-splits');
    const profileEl = document.getElementById('gap-profile');
    if (!splitsEl) return;
    const set = (id: string, v: string): void => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    const paceSec = TimeFormatter.tryParse(
      (document.getElementById('gap-pace-input') as HTMLInputElement | null)?.value || ''
    );
    const points = this.lastText ? GapCalculator.parseGpx(this.lastText) : [];
    const analysis =
      points.length >= 2 && paceSec !== null && paceSec > 0
        ? GapCalculator.analyze(points, paceSec)
        : null;

    const readoutEl = document.getElementById('gap-readout');

    if (!analysis) {
      OUTPUT_IDS.forEach((id) => set(id, '--'));
      if (profileEl) profileEl.innerHTML = '';
      if (readoutEl) readoutEl.textContent = '';
      splitsEl.innerHTML = '';
      return;
    }

    set('gap-totaldist', `${analysis.totalDistKm} km`);
    set('gap-ascent', `+${analysis.totalAscentM} m`);
    set('gap-descent', `-${analysis.totalDescentM} m`);
    set('gap-predicted', `${TimeFormatter.format(analysis.gapPaceSec)}/km`);
    if (readoutEl) {
      readoutEl.textContent = TranslationManager.format('gap_readout', {
        dist: analysis.totalDistKm,
        ascent: analysis.totalAscentM,
        pace: `${TimeFormatter.format(analysis.gapPaceSec)}/km`
      });
    }
    if (profileEl) profileEl.innerHTML = this.buildProfile(analysis.elevations);

    // Optional heart-rate band: Karvonen marathon→threshold (endurance) zone.
    const maxHr = parseFloat(
      (document.getElementById('gap-maxhr-input') as HTMLInputElement | null)?.value || ''
    );
    const restHr = parseFloat(
      (document.getElementById('gap-resthr-input') as HTMLInputElement | null)?.value || ''
    );
    const zones =
      isFinite(maxHr) && isFinite(restHr) ? HeartRateCalculator.karvonenZones(maxHr, restHr) : [];
    set('gap-hr-band', zones.length >= 3 ? `${zones[1].loBpm}–${zones[2].hiBpm} bpm` : '--');

    const t = TranslationManager.getDict();
    const head = `<div class="fuel-row fuel-head"><span>${t.col_km || 'km'}</span><span>${t.gap_ascent_col || '+m'}</span><span>${t.gap_gf_col || '×'}</span><span>${t.col_pace || ''}</span></div>`;
    let nextFuel = FIRST_FUEL_SEC;
    splitsEl.innerHTML =
      head +
      analysis.kmSplits
        .map((s) => {
          let fuel = '';
          if (s.cumTimeSec >= nextFuel) {
            fuel = ' 🍬';
            nextFuel += FUEL_INTERVAL_SEC;
          }
          return `<div class="fuel-row"><span>${s.km}</span><span>+${s.ascentM}</span><span>×${s.gradeFactor}</span><span class="mono-text">${TimeFormatter.format(s.paceSec)}${fuel}</span></div>`;
        })
        .join('');
  }

  /** Build a normalised inline SVG elevation profile (downsampled, CSP-safe). */
  private static buildProfile(ele: number[]): string {
    if (ele.length < 2) return '';
    let min = ele[0];
    let max = ele[0];
    for (const e of ele) {
      if (e < min) min = e;
      if (e > max) max = e;
    }
    const range = max - min || 1;
    const w = 300;
    const h = 60;
    const step = Math.max(1, Math.ceil(ele.length / w));
    const coords: string[] = [];
    for (let i = 0; i < ele.length; i += step) {
      const x = (i / (ele.length - 1)) * w;
      const y = h - ((ele[i] - min) / range) * h;
      coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="gap-profile-svg" role="img" aria-label="elevation profile"><polyline points="${coords.join(' ')}" fill="none" stroke="var(--highlight)" stroke-width="2"/></svg>`;
  }
}

export default GapController;
