// Live Visual Editor — Phase 3 per-element override compiler (PURE).
//
// compileElement(editId, override, opts) -> { cssText, diagnostics }
// Emits rules inside `@layer ve-overrides` with `!important`, so they win over
// host Tailwind/utility classes within the supported cascade model (I8).
// Variants: theme (.dark), breakpoint (@media min-width), state (:hover/:focus/
// :active). Tombstones (null) are skipped. Output order is deterministic.
//
// capabilities (allowedProperties) are an explicit argument. When omitted
// (e.g. applying already-saved overrides with no DOM to read), property
// allow-listing is skipped but the hard sanitizer still runs.

import { sanitizeDeclaration } from './sanitizer.js';

const BREAKPOINTS = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' };
const STATES = new Set(['hover', 'focus', 'active']);

function escapeId(id) {
  return String(id).replace(/["\\]/g, '\\$&');
}

// "dark.md.hover" -> { theme:'dark', breakpoint:'md', state:'hover' } (axis order fixed)
function parseVariantKey(key) {
  let theme = null;
  let breakpoint = null;
  let state = null;
  for (const part of String(key || 'base').split('.')) {
    if (part === 'base' || part === '') continue;
    if (part === 'dark' || part === 'light') theme = part;
    else if (BREAKPOINTS[part]) breakpoint = part;
    else if (STATES.has(part)) state = part;
  }
  return { theme, breakpoint, state };
}

function buildSelector(editId, { theme, state }) {
  const base = `[data-edit-id="${escapeId(editId)}"]`;
  const themed = theme === 'dark' ? `.dark ${base}` : base;
  return state ? `${themed}:${state}` : themed;
}

export function compileElement(editId, override, opts = {}) {
  const { cssSupports, allowedProperties = null } = opts;
  const diagnostics = [];
  const variants = (override && override.variants) || {};

  const mediaGroups = {}; // mediaQuery ('' = none) -> rule strings

  // Deterministic: 'base' first, then alphabetical variant keys.
  const keys = Object.keys(variants).sort((a, b) => {
    if (a === 'base') return -1;
    if (b === 'base') return 1;
    return a.localeCompare(b);
  });

  for (const key of keys) {
    const decls = variants[key] || {};
    const { theme, breakpoint, state } = parseVariantKey(key);
    const selector = buildSelector(editId, { theme, state });

    const lines = [];
    for (const [prop, raw] of Object.entries(decls)) {
      if (raw === null || raw === undefined) continue; // tombstone -> reset to baseline
      const res = sanitizeDeclaration({ property: prop, value: raw, cssSupports, allowedProperties });
      if (!res.ok) {
        diagnostics.push({ editId, variant: key, property: prop, ok: false, reason: res.reason, value: String(raw) });
        continue;
      }
      lines.push(`  ${res.property}: ${res.value} !important;`);
    }
    if (!lines.length) continue;

    const rule = `${selector} {\n${lines.join('\n')}\n}`;
    const mq = breakpoint ? `@media (min-width: ${BREAKPOINTS[breakpoint]})` : '';
    (mediaGroups[mq] = mediaGroups[mq] || []).push(rule);
  }

  const inner = [];
  if (mediaGroups['']) inner.push(mediaGroups[''].join('\n'));
  for (const mq of Object.keys(mediaGroups)) {
    if (mq === '') continue;
    inner.push(`${mq} {\n${mediaGroups[mq].join('\n')}\n}`);
  }
  if (override && override.hidden) {
    inner.push(`${buildSelector(editId, {})} { display: none !important; }`);
  }

  const body = inner.join('\n');
  const cssText = body ? `@layer ve-overrides {\n${body}\n}` : '';
  return { cssText, diagnostics };
}
