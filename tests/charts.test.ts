import test from 'node:test';
import assert from 'node:assert/strict';

import { zoneBar, gauge, phaseStrip, barSeries, sparkline } from '../src/modules/ui/viz/Charts.js';

test('zoneBar: one column per segment, palette ramps z1..zN, escapes text', () => {
  const html = zoneBar([
    { label: 'E', value: '5:35', caption: '有氧' },
    { label: 'T', value: '4:20' }
  ]);
  assert.equal((html.match(/zbar-col/g) || []).length, 2);
  assert.match(html, /z1[^]*z2/); // intensity ramps by order
  assert.match(html, /5:35/);
  assert.match(html, /有氧/);
  assert.equal(zoneBar([]), '');
  // escaping
  assert.match(zoneBar([{ label: '<x>', value: 'a&b' }]), /&lt;x&gt;[^]*a&amp;b/);
});

test('gauge: bands sum across range, pointer clamped into [0,100]%', () => {
  const html = gauge({
    value: 1.1,
    min: 0,
    max: 2,
    bands: [
      { upTo: 0.8, cls: 'warn' },
      { upTo: 1.3, cls: 'good' },
      { upTo: 1.5, cls: 'warn' },
      { upTo: 2, cls: 'bad' }
    ],
    valueLabel: '1.10'
  });
  assert.match(html, /gauge-good/);
  assert.match(html, /gauge-pointer/);
  assert.match(html, /1\.10/);
  // pointer at (1.1-0)/2 = 55%
  assert.match(html, /left:55\.00%/);
  // out-of-range value clamps to 100%
  const over = gauge({ value: 9, min: 0, max: 2, bands: [{ upTo: 2, cls: 'good' }] });
  assert.match(over, /left:100\.00%/);
});

test('phaseStrip: flex-grow proportional to weight, labels present', () => {
  const html = phaseStrip([
    { label: 'Base', weight: 8 },
    { label: 'Build', weight: 4 },
    { label: 'Peak', weight: 2, cls: 'gauge-bad' }
  ]);
  assert.equal((html.match(/phase-seg/g) || []).length, 3);
  assert.match(html, /flex-grow:8/);
  assert.match(html, /gauge-bad/); // explicit class honoured
  assert.match(html, /Base[^]*Build[^]*Peak/);
  assert.equal(phaseStrip([]), '');
});

test('barSeries: heights normalised to max, min floor applied', () => {
  const html = barSeries([
    { label: 'D-3', value: 7 },
    { label: 'D-1', value: 12 },
    { label: '0', value: 0 }
  ]);
  assert.equal((html.match(/bars-col/g) || []).length, 3);
  assert.match(html, /height:100\.0%/); // max bar (12)
  assert.match(html, /height:58\.3%/); // 7/12
  assert.match(html, /height:2\.0%/); // zero floored to 2%
});

test('sparkline: needs >=2 points, draws polyline, band rect, last marker', () => {
  assert.equal(sparkline({ points: [1] }), '');
  const html = sparkline({ points: [60, 62, 58, 61, 55], band: { lo: 56, hi: 64 } });
  assert.match(html, /<svg[^>]*viewBox="0 0 300 60"/);
  assert.match(html, /<polyline points="0\.0,/);
  assert.match(html, /spark-band/);
  assert.match(html, /spark-last/);
});

test('gauge guards NaN value and exposes aria-label (no NaN in markup)', () => {
  const html = gauge({ value: NaN, min: 0, max: 2, bands: [{ upTo: 2, cls: 'good' }] });
  assert.ok(!/NaN|Infinity/.test(html), 'no NaN/Infinity leaked into markup');
  assert.match(html, /aria-label=/);
});

test('zoneBar exposes data-derived aria-label', () => {
  assert.match(zoneBar([{ label: 'E', value: '5:00' }]), /aria-label="E 5:00"/);
});

test('sparkline bails on non-finite points; all-equal still draws', () => {
  assert.equal(sparkline({ points: [1, NaN, 3] }), '');
  assert.match(sparkline({ points: [5, 5, 5] }), /<svg/);
  assert.equal(
    sparkline({ points: [60, 62], band: { lo: NaN, hi: 64 } }).includes('spark-band'),
    false
  );
});

test('phaseStrip/barSeries sanitise cls — no attribute-breakout', () => {
  const h = phaseStrip([{ label: 'x', weight: 1, cls: 'z1" onclick="alert(1)' }]);
  assert.ok(!/onclick="/.test(h), 'quote+attribute injection neutralised');
  assert.match(h, /class="phase-seg z1onclickalert1"/);
});
