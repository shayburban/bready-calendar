// Pure-Node tests for the Live Visual Editor compiler/sanitizer/color utils.
// Run: node --test src/lib/ve/__tests__
//
// These cover the browser-independent logic. The CSS.supports syntactic gate is
// stubbed here (it is exercised for real in the Playwright suite, Phase 6).

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { compileTokens } from '../compileTokens.js';
import { sanitizeTokenValue, scanForInjection } from '../sanitizer.js';
import { hexToHslTriplet, hslTripletToHex } from '../colorUtils.js';

// Crude but deterministic stand-in for CSS.supports.
const stubSupports = (prop, val) => {
  if (prop === 'color') return /^hsl\(\s*-?\d/.test(val);
  if (prop === 'border-radius') return /^(-?\d*\.?\d+(px|rem|em|%)?|(calc|clamp|min|max)\(.+\))$/.test(val);
  return true;
};

test('compileTokens emits registry-ordered, deterministic CSS', () => {
  const { cssText, diagnostics } = compileTokens(
    { '--ve-radius': '0.75rem', '--ve-primary': '222 89% 39%' },
    { cssSupports: stubSupports },
  );
  assert.equal(
    cssText,
    ':root {\n  --ve-primary: 222 89% 39%;\n  --ve-radius: 0.75rem;\n}',
  );
  assert.deepEqual(diagnostics, []);
});

test('empty config compiles to empty cssText (site uses defaults)', () => {
  assert.equal(compileTokens({}, { cssSupports: stubSupports }).cssText, '');
});

test('malicious values are rejected, never emitted', () => {
  const malicious = {
    '--ve-primary': 'red; } body{display:none}',     // ; and braces
    '--ve-background': 'url(http://evil/x.png)',       // url(
    '--ve-foreground': 'red !important',               // !important
    '--ve-accent': 'javascript:alert(1)',              // scheme
  };
  const { cssText, diagnostics } = compileTokens(malicious, { cssSupports: stubSupports });
  assert.equal(cssText, '');
  assert.equal(diagnostics.length, 4);
  assert.ok(diagnostics.every((d) => d.ok === false && typeof d.reason === 'string'));
});

test('scanForInjection flags the classic breakout chars', () => {
  for (const v of ['a;b', 'a{b', 'a}b', 'x<y', 'x>y', 'url(z)', '/* c */', 'expression(1)']) {
    assert.ok(scanForInjection(v), `expected rejection for: ${v}`);
  }
  assert.equal(scanForInjection('222 89% 39%'), null);
});

test('unknown tokens become diagnostics, not CSS', () => {
  const { cssText, diagnostics } = compileTokens({ '--ve-bogus': '1px' }, { cssSupports: stubSupports });
  assert.equal(cssText, '');
  assert.equal(diagnostics[0].token, '--ve-bogus');
  assert.match(diagnostics[0].reason, /unknown token/);
});

test('length magnitude cap rejects oversized radii', () => {
  const r = sanitizeTokenValue({ kind: 'length', value: '999px', cssSupports: stubSupports, cap: { maxPx: 64 } });
  assert.equal(r.ok, false);
  assert.match(r.reason, /maximum/);
});

test('var() policy: self-reference and unknown refs are rejected', () => {
  const selfRef = sanitizeTokenValue({
    kind: 'length', value: 'var(--ve-radius)', cssSupports: stubSupports,
    knownVeNames: new Set(['--ve-radius']), selfName: '--ve-radius',
  });
  assert.equal(selfRef.ok, false);
  assert.match(selfRef.reason, /cycle/);

  const unknownRef = sanitizeTokenValue({
    kind: 'length', value: 'var(--not-a-token)', cssSupports: stubSupports,
    knownVeNames: new Set(['--ve-radius']),
  });
  assert.equal(unknownRef.ok, false);
  assert.match(unknownRef.reason, /--ve-\*/);
});

test('clamp() shape is allowed (CSS.supports validates, blacklist passes)', () => {
  const r = sanitizeTokenValue({ kind: 'length', value: 'clamp(0.25rem, 1vw, 1rem)', cssSupports: stubSupports });
  assert.equal(r.ok, true);
});

test('colorUtils round-trips pure colors exactly', () => {
  assert.equal(hslTripletToHex(hexToHslTriplet('#ffffff')), '#ffffff');
  assert.equal(hslTripletToHex(hexToHslTriplet('#000000')), '#000000');
  // a brand-ish blue should land within rounding distance and stay valid hex
  const hex = hslTripletToHex(hexToHslTriplet('#0263c4'));
  assert.match(hex, /^#[0-9a-f]{6}$/);
});
