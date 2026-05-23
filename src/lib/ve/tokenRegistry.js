// Live Visual Editor — Phase 1 (Design Bridge)
// The curated set of GLOBAL theme tokens the editor is allowed to drive.
//
// Each entry maps a namespaced `--ve-*` token onto a real theme token that
// already exists in src/index.css (and is consumed by tailwind.config.js via
// hsl(var(--x)) / var(--radius)). The bridge re-points each real token at
// `var(--ve-x, <existing default>)`, so:
//   - when no override exists, the original default applies => site unchanged (I5)
//   - when an admin sets --ve-x, it flows into the real token => live restyle
//
// `default` MUST equal the current src/index.css :root (light) value verbatim,
// because it is the fallback baked into the bridge mapping.
//
// kind drives BOTH the sanitizer validation path and the admin input control:
//   'hsl-triplet'  -> shadcn color tokens, stored as "H S% L%", used as hsl(var(--x))
//   'length'       -> e.g. "0.5rem" / "8px", used directly
//
// INVARIANT: --ve-* names never collide with host tokens (--primary/--radius/...).

export const TOKEN_KINDS = {
  HSL_TRIPLET: 'hsl-triplet',
  LENGTH: 'length',
};

export const TOKEN_REGISTRY = [
  {
    ve: '--ve-primary',
    maps: '--primary',
    kind: TOKEN_KINDS.HSL_TRIPLET,
    label: 'Primary',
    group: 'Colors',
    default: '0 0% 9%',
  },
  {
    ve: '--ve-background',
    maps: '--background',
    kind: TOKEN_KINDS.HSL_TRIPLET,
    label: 'Background',
    group: 'Colors',
    default: '0 0% 100%',
  },
  {
    ve: '--ve-foreground',
    maps: '--foreground',
    kind: TOKEN_KINDS.HSL_TRIPLET,
    label: 'Text',
    group: 'Colors',
    default: '0 0% 3.9%',
  },
  {
    ve: '--ve-accent',
    maps: '--accent',
    kind: TOKEN_KINDS.HSL_TRIPLET,
    label: 'Accent',
    group: 'Colors',
    default: '0 0% 96.1%',
  },
  {
    ve: '--ve-radius',
    maps: '--radius',
    kind: TOKEN_KINDS.LENGTH,
    label: 'Corner radius',
    group: 'Shape',
    default: '0.5rem',
    // Per-capability magnitude cap (Phase 1: keep radii sane).
    cap: { maxPx: 64, maxRem: 4 },
  },
];

// Fast lookups (kept as plain objects/maps; the registry itself is the source of truth).
export const REGISTRY_BY_VE = new Map(TOKEN_REGISTRY.map((r) => [r.ve, r]));
export const KNOWN_VE_NAMES = new Set(TOKEN_REGISTRY.map((r) => r.ve));
