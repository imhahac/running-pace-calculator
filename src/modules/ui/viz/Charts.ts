/**
 * Charts — pure, dependency-free chart builders that return HTML/SVG strings.
 *
 * Offline-first + single-bundle constraint: NO external chart library. Colours
 * come from CSS custom properties / palette classes (see assets/css/main.css)
 * so every chart follows the light/dark theme automatically. Functions are pure
 * and deterministic (no Date/Math.random) → unit-testable.
 */

function esc(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'
  );
}

/** Sanitise a CSS class token to a safe charset (defence-in-depth over esc). */
function clsSafe(s: string): string {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Coerce to a finite number (charts must never emit NaN/Infinity into markup). */
function fin(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** A segment of a zone bar (e.g. one of E/M/T/I/R or an HR zone). */
export interface IZoneSeg {
  /** Short label shown inside the coloured block (e.g. "E", "Z1"). */
  label: string;
  /** Value shown under the block (e.g. a pace "5:35" or "150–160 bpm"). */
  value: string;
  /** Optional one-word caption under the value (e.g. "有氧"). */
  caption?: string;
}

/**
 * Horizontal zone bar: N coloured blocks (intensity ramps with order via the
 * z1..z6 palette) each with a label, value and optional caption.
 */
export function zoneBar(segments: IZoneSeg[]): string {
  if (!segments.length) return '';
  const cols = segments
    .map((s, i) => {
      const z = Math.min(i + 1, 6);
      const cap = s.caption ? `<span class="zbar-cap">${esc(s.caption)}</span>` : '';
      return (
        `<div class="zbar-col">` +
        `<div class="zbar-seg z${z}"><span class="zbar-label">${esc(s.label)}</span></div>` +
        `<span class="zbar-val">${esc(s.value)}</span>${cap}` +
        `</div>`
      );
    })
    .join('');
  const aria = esc(segments.map((s) => `${s.label} ${s.value}`).join(', '));
  return `<div class="zbar" role="img" aria-label="${aria}">${cols}</div>`;
}

export interface IGaugeBand {
  /** Upper bound of this band (in value units). */
  upTo: number;
  cls: 'good' | 'warn' | 'bad';
}

/**
 * Linear gauge: coloured bands across [min,max] with a pointer + label at
 * `value`. Pure HTML/CSS (avoids non-uniform SVG text scaling).
 */
export function gauge(opts: {
  value: number;
  min: number;
  max: number;
  bands: IGaugeBand[];
  valueLabel?: string;
}): string {
  // Guard against NaN/Infinity so we never emit `left:NaN%` etc.
  const min = fin(opts.min);
  const max = fin(opts.max, min + 1);
  const value = fin(opts.value, min);
  const span = max - min || 1;
  const pos = clamp(((value - min) / span) * 100, 0, 100);
  // NOTE: bands must be supplied in ascending `upTo` order.
  let prev = min;
  const bands = opts.bands
    .map((b) => {
      const top = clamp(fin(b.upTo, min), min, max);
      const w = clamp(((top - prev) / span) * 100, 0, 100);
      prev = top;
      return `<span class="gauge-band gauge-${clsSafe(b.cls)}" style="width:${w.toFixed(2)}%"></span>`;
    })
    .join('');
  const label = esc(opts.valueLabel ?? String(value));
  return (
    `<div class="gauge" role="img" aria-label="${label}">` +
    `<div class="gauge-track">${bands}<span class="gauge-pointer" style="left:${pos.toFixed(2)}%"></span></div>` +
    `<div class="gauge-readout"><span class="gauge-label" style="left:${pos.toFixed(2)}%">${label}</span></div>` +
    `</div>`
  );
}

export interface IPhase {
  label: string;
  /** Relative width (e.g. number of weeks). */
  weight: number;
  caption?: string;
  /** Optional explicit palette/status class; defaults to z1..z6 by order. */
  cls?: string;
}

/** Horizontal phase strip: segments sized by `weight` (e.g. periodisation). */
export function phaseStrip(phases: IPhase[]): string {
  if (!phases.length) return '';
  const segs = phases
    .map((p, i) => {
      const grow = p.weight > 0 ? p.weight : 0.0001;
      const z = Math.min(i + 1, 6);
      const cls = p.cls ? clsSafe(p.cls) : `z${z}`;
      const cap = p.caption ? `<span class="phase-cap">${esc(p.caption)}</span>` : '';
      return (
        `<div class="phase-seg ${cls}" style="flex-grow:${grow}">` +
        `<span class="phase-label">${esc(p.label)}</span>${cap}` +
        `</div>`
      );
    })
    .join('');
  const aria = esc(phases.map((p) => p.label).join(' → '));
  return `<div class="phase-strip" role="img" aria-label="${aria}">${segs}</div>`;
}

export interface IBar {
  label: string;
  value: number;
  caption?: string;
  cls?: string;
}

/** Vertical bar series, heights normalised to the max value. */
export function barSeries(bars: IBar[]): string {
  if (!bars.length) return '';
  const max = bars.reduce((m, b) => Math.max(m, fin(b.value)), 0) || 1;
  const cols = bars
    .map((b, i) => {
      const h = clamp((fin(b.value) / max) * 100, 2, 100);
      const z = Math.min(i + 1, 6);
      const cls = b.cls ? clsSafe(b.cls) : `z${z}`;
      const cap = b.caption ? `<span class="bars-cap">${esc(b.caption)}</span>` : '';
      return (
        `<div class="bars-col">` +
        `<div class="bars-track"><div class="bars-fill ${cls}" style="height:${h.toFixed(1)}%"></div></div>` +
        `<span class="bars-label">${esc(b.label)}</span>${cap}` +
        `</div>`
      );
    })
    .join('');
  const aria = esc(bars.map((b) => `${b.label} ${b.value}`).join(', '));
  return `<div class="bars" role="img" aria-label="${aria}">${cols}</div>`;
}

/**
 * SVG trend line (sparkline) with an optional shaded normal band (lo..hi) and a
 * marker on the last point. Same inline-SVG approach as the GPX profile.
 */
export function sparkline(opts: { points: number[]; band?: { lo: number; hi: number } }): string {
  const pts = opts.points;
  // Bail on too-few or non-finite data rather than emit a broken polyline.
  if (pts.length < 2 || pts.some((p) => !Number.isFinite(p))) return '';
  const band =
    opts.band && Number.isFinite(opts.band.lo) && Number.isFinite(opts.band.hi)
      ? opts.band
      : undefined;
  let min = pts[0];
  let max = pts[0];
  for (const p of pts) {
    if (p < min) min = p;
    if (p > max) max = p;
  }
  if (band) {
    min = Math.min(min, band.lo);
    max = Math.max(max, band.hi);
  }
  const range = max - min || 1;
  const w = 300;
  const h = 60;
  const xAt = (i: number): number => (i / (pts.length - 1)) * w;
  const yAt = (v: number): number => h - ((v - min) / range) * h;
  const coords = pts.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const bandRect = band
    ? `<rect x="0" y="${yAt(band.hi).toFixed(1)}" width="${w}" height="${Math.max(0, yAt(band.lo) - yAt(band.hi)).toFixed(1)}" class="spark-band"/>`
    : '';
  const lx = xAt(pts.length - 1).toFixed(1);
  const ly = yAt(pts[pts.length - 1]).toFixed(1);
  const aria = `trend ${pts[0]} → ${pts[pts.length - 1]}`;
  return (
    `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="spark-svg" role="img" aria-label="${esc(aria)}">` +
    `${bandRect}<polyline points="${coords}" fill="none" stroke="var(--highlight)" stroke-width="2"/>` +
    `<circle cx="${lx}" cy="${ly}" r="3" class="spark-last"/></svg>`
  );
}

export default { zoneBar, gauge, phaseStrip, barSeries, sparkline };
