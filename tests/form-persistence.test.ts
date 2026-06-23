import test from 'node:test';
import assert from 'node:assert/strict';

import FormPersistence from '../src/modules/state/FormPersistence.js';

type Stub = { value: string; type: string };

function withStubs(els: Record<string, Stub>, fn: () => void): void {
  const g = globalThis as unknown as Record<string, unknown>;
  const origDoc = g.document;
  const origLs = g.localStorage;
  const store: Record<string, string> = {};
  g.document = { getElementById: (id: string) => els[id] || null };
  g.localStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    }
  };
  try {
    fn();
  } finally {
    g.document = origDoc;
    g.localStorage = origLs;
  }
}

test('save then restore roundtrips input + select values', () => {
  const els: Record<string, Stub> = {
    'a-input': { value: '', type: 'text' },
    'b-select': { value: '', type: 'select-one' }
  };
  withStubs(els, () => {
    els['a-input'].value = '5:30';
    els['b-select'].value = 'wa';
    FormPersistence.save(['a-input', 'b-select']);

    els['a-input'].value = '';
    els['b-select'].value = '';
    FormPersistence.restore(['a-input', 'b-select']);

    assert.equal(els['a-input'].value, '5:30');
    assert.equal(els['b-select'].value, 'wa');
  });
});

test('snapshot: skips empty by default, includes cleared fields when asked', () => {
  const els: Record<string, Stub> = {
    'a-input': { value: '', type: 'text' },
    'b-input': { value: 'x', type: 'text' }
  };
  withStubs(els, () => {
    assert.deepEqual(FormPersistence.snapshot(['a-input', 'b-input']), { 'b-input': 'x' });
    assert.deepEqual(FormPersistence.snapshot(['a-input', 'b-input'], true), {
      'a-input': '',
      'b-input': 'x'
    });
  });
});

test('apply sets element values', () => {
  const els: Record<string, Stub> = { 'a-input': { value: '', type: 'text' } };
  withStubs(els, () => {
    FormPersistence.apply({ 'a-input': '5:30' });
    assert.equal(els['a-input'].value, '5:30');
  });
});

test('file inputs are never persisted', () => {
  const els: Record<string, Stub> = { 'f-input': { value: 'C:\\fake', type: 'file' } };
  withStubs(els, () => {
    FormPersistence.save(['f-input']);
    els['f-input'].value = '';
    els['f-input'].type = 'file';
    FormPersistence.restore(['f-input']);
    assert.equal(els['f-input'].value, ''); // untouched
  });
});
