/**
 * GapCalculator
 * Grade-adjusted-pace analysis of a GPX route. Parses track points, measures
 * distance (haversine) and gradient per segment, and applies the Minetti (2002)
 * gradient energy cost (via EnvironmentalPaceCalculator.gradeFactor) to predict
 * the pace each kilometre will actually take at a given flat-ground effort.
 * Pure + testable (regex parser works in Node and the browser).
 */

import EnvironmentalPaceCalculator from './EnvironmentalPaceCalculator.js';

export interface IGpxPoint {
  lat: number;
  lon: number;
  ele: number;
}

export interface IGapKm {
  km: number;
  ascentM: number;
  descentM: number;
  gradeFactor: number;
  paceSec: number;
  cumTimeSec: number;
}

export interface IGapAnalysis {
  totalDistKm: number;
  totalAscentM: number;
  totalDescentM: number;
  gapPaceSec: number; // predicted average pace over the route
  flatPaceSec: number;
  elevations: number[]; // per-point elevation for an inline profile
  kmSplits: IGapKm[];
}

export class GapCalculator {
  /** Parse <trkpt> elements from a GPX string (attribute order agnostic). */
  static parseGpx(xml: string): IGpxPoint[] {
    const points: IGpxPoint[] = [];
    if (!xml) return points;
    const trkptRe = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/gi;
    let m: RegExpExecArray | null;
    while ((m = trkptRe.exec(xml)) !== null) {
      const attrs = m[1] || '';
      const inner = m[2] || '';
      const lat = parseFloat((attrs.match(/lat="([-0-9.]+)"/) || [])[1] || 'NaN');
      const lon = parseFloat((attrs.match(/lon="([-0-9.]+)"/) || [])[1] || 'NaN');
      const eleRaw = (inner.match(/<ele>([-0-9.]+)<\/ele>/) || [])[1];
      const ele = parseFloat(eleRaw || '0');
      if (isFinite(lat) && isFinite(lon)) {
        points.push({ lat, lon, ele: isFinite(ele) ? ele : 0 });
      }
    }
    return points;
  }

  /** Great-circle distance between two points (metres). */
  static distM(a: IGpxPoint, b: IGpxPoint): number {
    const R = 6371000;
    const toRad = (d: number): number => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /** Analyse a route against a flat-ground target pace (sec/km). */
  /**
   * Centered moving-average smoothing of elevations to damp GPS/barometer noise
   * (which otherwise inflates grade → climbing cost). Left as-is for short or
   * synthetic tracks (< 8 points) to avoid flattening real signal.
   */
  static smoothElevations(ele: number[]): number[] {
    const n = ele.length;
    if (n < 8) return ele.slice();
    const win = 2; // window of 5
    const out: number[] = new Array(n);
    for (let i = 0; i < n; i += 1) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - win); j <= Math.min(n - 1, i + win); j += 1) {
        sum += ele[j];
        count += 1;
      }
      out[i] = sum / count;
    }
    return out;
  }

  static analyze(points: IGpxPoint[], flatPaceSec: number): IGapAnalysis | null {
    if (points.length < 2 || !(flatPaceSec > 0)) return null;

    const smoothed = this.smoothElevations(points.map((p) => p.ele));
    const buckets = new Map<number, { dist: number; time: number; asc: number; desc: number }>();
    let cumDist = 0;
    let totalAscent = 0;
    let totalDescent = 0;
    let totalTime = 0;

    for (let i = 1; i < points.length; i += 1) {
      const d = this.distM(points[i - 1], points[i]);
      if (!(d > 0)) continue;
      const dEle = smoothed[i] - smoothed[i - 1];
      const gradePct = (dEle / d) * 100;
      const gf = EnvironmentalPaceCalculator.gradeFactor(gradePct);
      const segTime = (d / 1000) * flatPaceSec * gf;

      cumDist += d;
      totalTime += segTime;
      const asc = dEle > 0 ? dEle : 0;
      const desc = dEle < 0 ? -dEle : 0;
      totalAscent += asc;
      totalDescent += desc;

      const kmIdx = Math.floor((cumDist - d / 2) / 1000) + 1; // bucket by segment midpoint
      const b = buckets.get(kmIdx) || { dist: 0, time: 0, asc: 0, desc: 0 };
      b.dist += d;
      b.time += segTime;
      b.asc += asc;
      b.desc += desc;
      buckets.set(kmIdx, b);
    }

    const kmSplits: IGapKm[] = [];
    let cum = 0;
    Array.from(buckets.keys())
      .sort((a, b) => a - b)
      .forEach((k) => {
        const b = buckets.get(k);
        if (!b || b.dist <= 0) return;
        const distKm = b.dist / 1000;
        cum += b.time;
        kmSplits.push({
          km: k,
          ascentM: Math.round(b.asc),
          descentM: Math.round(b.desc),
          gradeFactor: Math.round((b.time / distKm / flatPaceSec) * 1000) / 1000,
          paceSec: Math.round(b.time / distKm),
          cumTimeSec: Math.round(cum)
        });
      });

    const totalDistKm = cumDist / 1000;
    return {
      totalDistKm: Math.round(totalDistKm * 100) / 100,
      totalAscentM: Math.round(totalAscent),
      totalDescentM: Math.round(totalDescent),
      gapPaceSec: totalDistKm > 0 ? Math.round(totalTime / totalDistKm) : 0,
      flatPaceSec,
      elevations: points.map((p) => p.ele),
      kmSplits
    };
  }
}

export default GapCalculator;
