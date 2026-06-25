import test from 'node:test';
import assert from 'node:assert/strict';

import { TRANSLATIONS } from '../src/constants/index.js';

const zh = TRANSLATIONS.zh as Record<string, string>;
const en = TRANSLATIONS.en as Record<string, string>;
const placeholders = (s: string): string[] => (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).slice().sort();

test('i18n: zh and en have identical key sets', () => {
  const missingInEn = Object.keys(zh).filter((k) => !(k in en));
  const missingInZh = Object.keys(en).filter((k) => !(k in zh));
  assert.deepEqual(
    missingInEn,
    [],
    `keys present in zh but missing in en: ${missingInEn.join(', ')}`
  );
  assert.deepEqual(
    missingInZh,
    [],
    `keys present in en but missing in zh: ${missingInZh.join(', ')}`
  );
  assert.equal(Object.keys(zh).length, Object.keys(en).length);
});

test('i18n: {placeholder} tokens match across languages for every key', () => {
  const mismatches: string[] = [];
  for (const k of Object.keys(zh)) {
    if (typeof zh[k] !== 'string' || typeof en[k] !== 'string') continue;
    const zp = placeholders(zh[k]).join(',');
    const ep = placeholders(en[k]).join(',');
    if (zp !== ep) mismatches.push(`${k}: zh{${zp}} vs en{${ep}}`);
  }
  assert.deepEqual(mismatches, [], `placeholder mismatches:\n${mismatches.join('\n')}`);
});
