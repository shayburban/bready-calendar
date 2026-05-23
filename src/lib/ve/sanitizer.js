// Live Visual Editor — hard sanitizer gate (I3).
//
// EVERY token value passes through here before it is ever compiled into CSS.
// Invalid input is dropped with a reason, never emitted.
//
// Two layers:
//   1) A pure string blacklist (works in Node — testable without a browser).
//      Blocks anything that could break out of a declaration or inject behavior:
//      url(, expression(, javascript:, vbscript:, ; { } < >, CSS comments,
//      and "!important" inside values.
//   2) A syntactic validity check via CSS.supports (browser only). It is a
//      parse-only check and does NOT consult host stylesheets, so the host page
//      cannot bias the result — this is why we do not need a bespoke "detached
//      document" here ([RECOMMENDED] deviation, justified). In Node the check is
//      injectable/skippable so the pure logic stays unit-testable.
//
// var() policy: a value may reference custom properties only via var(--ve-*)
// where the name is a known registry token and is not the token being defined
// (self-cycle guard). Anything else is rejected. Deep multi-token cycle
// detection is extended in Phase 3 (overrides); Phase 1 tokens are leaf values.

const BLACKLIST = /(url\(|expression\(|javascript:|vbscript:|;|\{|\}|<|>|\/\*|\*\/|!important)/i;

const VAR_REF = /var\(\s*(--[A-Za-z0-9_-]+)/g;

export function scanForInjection(value) {
  return BLACKLIST.test(value) ? 'contains a disallowed character or token' : null;
}

// Validate any var() references in a value. Returns an error string or null.
function checkVarRefs(value, { knownVeNames, selfName } = {}) {
  if (!value.includes('var(')) return null;
  let m;
  VAR_REF.lastIndex = 0;
  while ((m = VAR_REF.exec(value)) !== null) {
    const ref = m[1];
    if (!ref.startsWith('--ve-')) return `var() may only reference --ve-* tokens (got ${ref})`;
    if (knownVeNames && !knownVeNames.has(ref)) return `var() references an unknown token (${ref})`;
    if (selfName && ref === selfName) return 'var() cannot reference its own token (cycle)';
  }
  return null;
}

// Magnitude cap for length values. cap = { maxPx, maxRem }.
function checkLengthCap(value, cap) {
  if (!cap) return null;
  const m = String(value).trim().match(/^(-?\d*\.?\d+)\s*(px|rem|em|%)?$/);
  if (!m) return null; // non-trivial length (e.g. calc()) — CSS.supports already vetted shape
  const n = parseFloat(m[1]);
  if (n < 0) return 'value cannot be negative';
  const unit = m[2] || '';
  if (unit === 'px' && cap.maxPx != null && n > cap.maxPx) return `exceeds the ${cap.maxPx}px maximum`;
  if ((unit === 'rem' || unit === 'em') && cap.maxRem != null && n > cap.maxRem) return `exceeds the ${cap.maxRem}rem maximum`;
  return null;
}

/**
 * Sanitize a single token value.
 * @returns {{ok:true, value:string} | {ok:false, reason:string}}
 */
export function sanitizeTokenValue({ kind, value, cssSupports, knownVeNames, selfName, cap }) {
  const v = String(value == null ? '' : value).trim();
  if (v === '') return { ok: false, reason: 'empty value' };

  const injection = scanForInjection(v);
  if (injection) return { ok: false, reason: injection };

  const varErr = checkVarRefs(v, { knownVeNames, selfName });
  if (varErr) return { ok: false, reason: varErr };

  // cssSupports is optional (absent in Node tests). When present, it is the
  // authoritative syntactic gate.
  const supports = typeof cssSupports === 'function' ? cssSupports : null;

  if (kind === 'hsl-triplet') {
    // Stored as "H S% L%"; validated as a real color when wrapped in hsl().
    if (supports && !supports('color', `hsl(${v})`)) {
      return { ok: false, reason: 'not a valid HSL triplet (expected e.g. "222 89% 39%")' };
    }
    return { ok: true, value: v };
  }

  if (kind === 'length') {
    if (supports && !supports('border-radius', v)) {
      return { ok: false, reason: 'not a valid length' };
    }
    const capErr = checkLengthCap(v, cap);
    if (capErr) return { ok: false, reason: capErr };
    return { ok: true, value: v };
  }

  return { ok: false, reason: `unknown token kind: ${kind}` };
}
