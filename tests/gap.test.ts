import test from 'node:test';
import assert from 'node:assert/strict';

import GapCalculator from '../src/modules/core/GapCalculator.js';

const GPX = `<?xml version="1.0"?><gpx><trk><trkseg>
<trkpt lat="25.000" lon="121.000"><ele>0</ele></trkpt>
<trkpt lat="25.009" lon="121.000"><ele>50</ele></trkpt>
<trkpt lat="25.018" lon="121.000"><ele>0</ele></trkpt>
</trkseg></trk></gpx>`;

test('parseGpx extracts points (attribute order, optional ele)', () => {
  const pts = GapCalculator.parseGpx(GPX);
  assert.equal(pts.length, 3);
  assert.equal(pts[0].lat, 25.0);
  assert.equal(pts[1].ele, 50);
  // lon-before-lat and self-closing forms both parse
  const alt = GapCalculator.parseGpx(
    '<trkpt lon="121.0" lat="25.0"/><trkpt lat="25.1" lon="121.1"/>'
  );
  assert.equal(alt.length, 2);
  assert.equal(alt[0].lat, 25.0);
  assert.equal(alt[0].ele, 0);
});

test('distM: ~1 km per 0.009° latitude', () => {
  const d = GapCalculator.distM(
    { lat: 25.0, lon: 121.0, ele: 0 },
    { lat: 25.009, lon: 121.0, ele: 0 }
  );
  assert.ok(Math.abs(d - 1000) < 30);
});

test('analyze: uphill km slower, downhill km faster, net climb slower than flat', () => {
  const a = GapCalculator.analyze(GapCalculator.parseGpx(GPX), 300);
  assert.ok(a);
  assert.equal(a?.kmSplits.length, 2);
  assert.ok((a?.kmSplits[0].paceSec ?? 0) > 300); // climbing km
  assert.ok((a?.kmSplits[1].paceSec ?? 0) < 300); // descending km
  assert.ok(Math.abs((a?.totalAscentM ?? 0) - 50) <= 1);
  assert.ok(Math.abs((a?.totalDescentM ?? 0) - 50) <= 1);
  assert.ok((a?.gapPaceSec ?? 0) > 300); // climbing costs more than descending saves
  assert.equal(a?.elevations.length, 3);
  // cumulative time is monotonic increasing across km splits
  assert.ok((a?.kmSplits[1].cumTimeSec ?? 0) > (a?.kmSplits[0].cumTimeSec ?? 0));
});

test('smoothElevations damps noise on long tracks, leaves short tracks intact', () => {
  const short = [0, 50, 0];
  assert.deepEqual(GapCalculator.smoothElevations(short), short); // < 8 points → untouched
  const noisy = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 100 : 110)); // sawtooth
  const sm = GapCalculator.smoothElevations(noisy);
  assert.ok(sm.every((v) => v >= 100 && v <= 110));
  const smRange = Math.max(...sm) - Math.min(...sm);
  assert.ok(smRange < 10); // noise range reduced vs the raw ±5 sawtooth
});

test('analyze rejects invalid input', () => {
  assert.equal(GapCalculator.analyze([], 300), null);
  assert.equal(GapCalculator.analyze(GapCalculator.parseGpx(GPX), 0), null);
});
