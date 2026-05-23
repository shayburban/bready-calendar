// Live Visual Editor — color conversion helpers.
//
// shadcn theme tokens are stored as bare HSL triplets ("H S% L%") and consumed
// as hsl(var(--token)). The admin <input type="color"> speaks hex, so we convert
// at the UI boundary only. The stored/compiled token value is always the triplet.
// Pure functions; no DOM.

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

/** "#rrggbb" | "#rgb" -> { r,g,b } 0..255, or null if unparseable. */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** "#rrggbb" -> "H S% L%" (rounded). Returns null on bad input. */
export function hexToHslTriplet(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** "H S% L%" -> "#rrggbb". Returns null on bad input. */
export function hslTripletToHex(triplet) {
  if (typeof triplet !== 'string') return null;
  const m = triplet.trim().match(/^(-?\d*\.?\d+)\s+(-?\d*\.?\d+)%\s+(-?\d*\.?\d+)%$/);
  if (!m) return null;
  const h = ((parseFloat(m[1]) % 360) + 360) % 360 / 360;
  const s = clamp(parseFloat(m[2]) / 100, 0, 1);
  const l = clamp(parseFloat(m[3]) / 100, 0, 1);

  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      let tt = t;
      if (tt < 0) tt += 1;
      if (tt > 1) tt -= 1;
      if (tt < 1 / 6) return p + (q - p) * 6 * tt;
      if (tt < 1 / 2) return q;
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x) => clamp(Math.round(x * 255), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
