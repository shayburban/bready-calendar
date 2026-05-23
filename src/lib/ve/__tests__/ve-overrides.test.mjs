// Pure-Node tests for the Phase 2/3 element-override engine.
// Run: node --test src/lib/ve/__tests__

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compileElement } from '../compileElement.js';
import { sanitizeDeclaration, EXCLUDED_PROPERTIES } from '../sanitizer.js';
import { makeEditId, parseEditId } from '../makeEditId.js';
import { propertiesForCapabilities, parseCapabilities } from '../capabilities.js';

const ok = () => true;

test('compileElement wraps base rules in @layer ve-overrides with !important', () => {
  const { cssText } = compileElement(
    'Home:heading:hero-title',
    { variants: { base: { color: '#ff0000', 'font-size': '48px' } } },
    { cssSupports: ok },
  );
  assert.match(cssText, /@layer ve-overrides \{/);
  assert.match(cssText, /\[data-edit-id="Home:heading:hero-title"\]/);
  assert.match(cssText, /color: #ff0000 !important;/);
  assert.match(cssText, /font-size: 48px !important;/);
});

test('excluded properties are rejected', () => {
  assert.ok(EXCLUDED_PROPERTIES.has('position'));
  const r = sanitizeDeclaration({ property: 'position', value: 'absolute', cssSupports: ok });
  assert.equal(r.ok, false);
  assert.match(r.reason, /not editable/);
});

test('malicious declaration values are rejected', () => {
  const r = sanitizeDeclaration({ property: 'color', value: 'red; } body{display:none}', cssSupports: ok });
  assert.equal(r.ok, false);
});

test('capability allow-list blocks out-of-scope properties', () => {
  const allowed = propertiesForCapabilities(['text']); // text has no background-color
  const { cssText, diagnostics } = compileElement(
    'p:type:id',
    { variants: { base: { 'background-color': '#ffffff' } } },
    { cssSupports: ok, allowedProperties: allowed },
  );
  assert.equal(cssText, '');
  assert.equal(diagnostics[0].ok, false);
  assert.match(diagnostics[0].reason, /capabilities/);
});

test('variant selectors compile theme + breakpoint + state', () => {
  const { cssText } = compileElement('x:y:z', { variants: { 'dark.md.hover': { color: '#000000' } } }, { cssSupports: ok });
  assert.match(cssText, /@media \(min-width: 768px\)/);
  assert.match(cssText, /\.dark \[data-edit-id="x:y:z"\]:hover/);
});

test('tombstone (null) is skipped', () => {
  const { cssText } = compileElement('x:y:z', { variants: { base: { color: null } } }, { cssSupports: ok });
  assert.equal(cssText, '');
});

test('makeEditId rejects empty segments and encodes inner colons', () => {
  assert.throws(() => makeEditId('', 'a', 'b'));
  assert.equal(makeEditId('Home', 'list', 'a:b'), 'Home:list:a%3Ab');
  assert.deepEqual(parseEditId('Home:heading:title'), { page: 'Home', type: 'heading', id: 'title' });
});

test('capabilities parse + property mapping', () => {
  const props = propertiesForCapabilities(parseCapabilities('text, box'));
  assert.ok(props.has('color'));
  assert.ok(props.has('border-radius'));
  assert.ok(!props.has('position'));
});
