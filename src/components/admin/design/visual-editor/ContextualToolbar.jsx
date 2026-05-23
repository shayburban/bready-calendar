import { AlignLeft, AlignCenter, AlignRight, Type, Square, RotateCcw } from 'lucide-react';
import { setDraftProperty, resetDraftProperty, draftValue } from '@/lib/ve/editorStore';
import { rgbToHex } from '@/lib/ve/colorUtils';

// Floating, element-specific controls. Editor chrome: clicking it must never
// deselect (the surface click handler ignores `.ve-chrome`). All edits are
// applied by the store via the override compiler/injector — never inline style.

const WEIGHTS = [
  { v: '300', label: 'Light' },
  { v: '400', label: 'Regular' },
  { v: '500', label: 'Medium' },
  { v: '600', label: 'Semibold' },
  { v: '700', label: 'Bold' },
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-gray-400">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  );
}

export default function ContextualToolbar({ editId, element, capabilities, style }) {
  const has = (p) => capabilities && capabilities.has(p);
  const cs = element && typeof getComputedStyle === 'function' ? getComputedStyle(element) : null;

  const get = (prop, fallback = '') => {
    const d = draftValue(editId, prop);
    if (d !== undefined) return d;
    return cs ? cs.getPropertyValue(prop).trim() : fallback;
  };
  const num = (prop) => {
    const n = parseFloat(get(prop, '0'));
    return Number.isFinite(n) ? n : 0;
  };
  const colorHex = (prop) => {
    const v = get(prop, '');
    if (v.startsWith('#')) return v;
    return rgbToHex(v) || '#000000';
  };

  const set = (prop, val) => setDraftProperty(editId, prop, val);
  const swallow = (e) => e.stopPropagation();

  return (
    <div
      className="ve-chrome absolute z-[60] flex items-end gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl"
      style={style}
      onClick={swallow}
      onMouseDown={swallow}
      role="toolbar"
      aria-label="Element style controls"
    >
      {has('color') && (
        <Field label="Color">
          <input
            type="color"
            aria-label="Text color"
            value={colorHex('color')}
            onChange={(e) => set('color', e.target.value)}
            className="h-7 w-7 rounded border"
          />
        </Field>
      )}

      {has('background-color') && (
        <Field label="Fill">
          <input
            type="color"
            aria-label="Background color"
            value={colorHex('background-color')}
            onChange={(e) => set('background-color', e.target.value)}
            className="h-7 w-7 rounded border"
          />
        </Field>
      )}

      {has('font-size') && (
        <Field label="Size">
          <Type className="h-3.5 w-3.5 text-gray-400" />
          <input
            type="number"
            aria-label="Font size (px)"
            min="8"
            max="160"
            value={Math.round(num('font-size'))}
            onChange={(e) => set('font-size', `${e.target.value}px`)}
            className="w-14 rounded border px-1 py-0.5 text-xs"
          />
        </Field>
      )}

      {has('font-weight') && (
        <Field label="Weight">
          <select
            aria-label="Font weight"
            value={String(parseInt(get('font-weight', '400'), 10) || 400)}
            onChange={(e) => set('font-weight', e.target.value)}
            className="rounded border px-1 py-0.5 text-xs"
          >
            {WEIGHTS.map((w) => (
              <option key={w.v} value={w.v}>{w.label}</option>
            ))}
          </select>
        </Field>
      )}

      {has('line-height') && (
        <Field label="Leading">
          <input
            type="number"
            aria-label="Line height"
            step="0.1"
            min="0.8"
            max="3"
            value={(() => { const n = num('line-height'); return n > 4 ? (n / (num('font-size') || 16)).toFixed(1) : (n || 1.5); })()}
            onChange={(e) => set('line-height', e.target.value)}
            className="w-14 rounded border px-1 py-0.5 text-xs"
          />
        </Field>
      )}

      {has('text-align') && (
        <Field label="Align">
          {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([val, Icon]) => (
            <button
              key={val}
              type="button"
              aria-label={`Align ${val}`}
              onClick={() => set('text-align', val)}
              className={`rounded p-1 ${get('text-align') === val ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </Field>
      )}

      {has('padding') && (
        <Field label="Padding">
          <Square className="h-3.5 w-3.5 text-gray-400" />
          <input
            type="number"
            aria-label="Padding (px)"
            min="0"
            max="96"
            value={Math.round(num('padding-top'))}
            onChange={(e) => set('padding', `${e.target.value}px`)}
            className="w-14 rounded border px-1 py-0.5 text-xs"
          />
        </Field>
      )}

      {has('border-radius') && (
        <Field label="Radius">
          <input
            type="number"
            aria-label="Corner radius (px)"
            min="0"
            max="96"
            value={Math.round(num('border-radius'))}
            onChange={(e) => set('border-radius', `${e.target.value}px`)}
            className="w-14 rounded border px-1 py-0.5 text-xs"
          />
        </Field>
      )}

      <button
        type="button"
        aria-label="Reset this element's edits"
        title="Reset this element"
        onClick={() => {
          ['color', 'background-color', 'font-size', 'font-weight', 'line-height', 'text-align', 'padding', 'border-radius']
            .forEach((p) => resetDraftProperty(editId, p));
        }}
        className="self-center rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
