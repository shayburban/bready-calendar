import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Save, X, AlertTriangle, Check } from 'lucide-react';
import { PAGE_LOADERS, PAGE_OPTIONS } from '../constants/previewOptions';
import { parseCapabilities, propertiesForCapabilities } from '@/lib/ve/capabilities';
import {
  useEditorStore, setMode, selectElement, deselect, setHover,
  initEditorFromConfig, saveEdits, cancelEdits,
} from '@/lib/ve/editorStore';
import EditorSidebar from './EditorSidebar';
import ContextualToolbar from './ContextualToolbar';

// Phase 4 — the click-to-edit experience layered on the Phase 1-3 engine.
// Renders real site pages in a same-document surface, lets the admin select
// instrumented elements in edit mode, and applies sandboxed edits through the
// override compiler/injector. NOTHING persists until Save Changes.

const VIEWPORTS = { desktop: '100%', tablet: '768px', mobile: '390px' };
const PREVIEWABLE = PAGE_OPTIONS.filter((p) => p.previewable);

const cssEscape = (id) => String(id).replace(/["\\]/g, '\\$&');

export default function VisualEditor() {
  const store = useEditorStore();
  const { mode, selectedId, hoveredId, draft, saving, status } = store;
  const dirty = Object.keys(draft).length > 0;

  const [page, setPage] = useState('Home');
  const [viewport, setViewport] = useState('desktop');
  const [selectedEl, setSelectedEl] = useState(null);
  const [rect, setRect] = useState(null);

  const surfaceRef = useRef(null); // static, positioned ancestor for overlays
  const scrollRef = useRef(null);  // independent scroll layer holding the page

  const PageComponent = useMemo(() => {
    const loader = PAGE_LOADERS[page];
    return React.lazy(() =>
      loader ? loader() : Promise.resolve({ default: () => <div className="p-8 text-gray-500">Page not previewable.</div> }),
    );
  }, [page]);

  useEffect(() => { initEditorFromConfig(); }, []);

  // Capture-phase click handling on the page scroll layer.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;
    const onClick = (e) => {
      const t = e.target;
      if (t.closest && t.closest('.ve-chrome')) return;
      if (mode !== 'edit') {
        const a = t.closest && t.closest('a');
        if (a) e.preventDefault(); // browse mode: keep the admin inside the preview
        return;
      }
      const el = t.closest && t.closest('[data-edit-id]');
      if (el && scroller.contains(el)) {
        e.preventDefault();
        e.stopPropagation();
        const id = el.getAttribute('data-edit-id');
        const caps = propertiesForCapabilities(parseCapabilities(el.getAttribute('data-edit-capabilities')));
        setSelectedEl(el);
        selectElement(id, caps);
      } else {
        setSelectedEl(null);
        deselect();
      }
    };
    scroller.addEventListener('click', onClick, true);
    return () => scroller.removeEventListener('click', onClick, true);
  }, [mode, page]);

  // Hover outline in edit mode.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller || mode !== 'edit') return undefined;
    const onOver = (e) => {
      const t = e.target;
      if (t.closest && t.closest('.ve-chrome')) return;
      const el = t.closest && t.closest('[data-edit-id]');
      setHover(el ? el.getAttribute('data-edit-id') : null);
    };
    const onLeave = () => setHover(null);
    scroller.addEventListener('mouseover', onOver);
    scroller.addEventListener('mouseleave', onLeave);
    return () => {
      scroller.removeEventListener('mouseover', onOver);
      scroller.removeEventListener('mouseleave', onLeave);
    };
  }, [mode, page]);

  // Selection/hover outline via an injected stylesheet (chrome; edit mode only).
  useEffect(() => {
    const STYLE_ID = 've-selection-overlay';
    let el = document.getElementById(STYLE_ID);
    if (mode !== 'edit') { if (el) el.remove(); return undefined; }
    if (!el) { el = document.createElement('style'); el.id = STYLE_ID; document.head.appendChild(el); }
    const rules = [];
    if (selectedId) rules.push(`[data-edit-id="${cssEscape(selectedId)}"]{ outline:2px solid #2563eb !important; outline-offset:1px; }`);
    if (hoveredId && hoveredId !== selectedId) rules.push(`[data-edit-id="${cssEscape(hoveredId)}"]{ outline:1px dashed #60a5fa !important; outline-offset:1px; }`);
    el.textContent = rules.join('\n');
    return undefined;
  }, [mode, selectedId, hoveredId]);

  useEffect(() => () => { const el = document.getElementById('ve-selection-overlay'); if (el) el.remove(); }, []);

  // Recompute the selected element's rect relative to the (static) surface.
  useEffect(() => {
    const compute = () => {
      const surface = surfaceRef.current;
      const scroller = scrollRef.current;
      if (!selectedEl || !surface || !scroller || !scroller.contains(selectedEl)) { setRect(null); return; }
      const r = selectedEl.getBoundingClientRect();
      const s = surface.getBoundingClientRect();
      setRect({ top: r.top - s.top, left: r.left - s.left, width: r.width, height: r.height });
    };
    compute();
    const scroller = scrollRef.current;
    const t = setTimeout(compute, 60);
    if (scroller) scroller.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      clearTimeout(t);
      if (scroller) scroller.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [selectedEl, selectedId, page, viewport]);

  // Reset selection when leaving edit mode or switching page.
  useEffect(() => { if (mode !== 'edit') setSelectedEl(null); }, [mode]);
  useEffect(() => { setSelectedEl(null); deselect(); }, [page]);

  // Discard sandbox edits when the editor unmounts (e.g. switching tabs) so a
  // draft can never leak onto the real site — only Save persists (D1).
  useEffect(() => () => { cancelEdits(); }, []);

  // Warn before leaving with unsaved sandbox edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const toolbarStyle = useMemo(() => {
    if (!rect) return null;
    const above = rect.top - 64;
    const top = above > 4 ? above : rect.top + rect.height + 8;
    const surfaceW = surfaceRef.current ? surfaceRef.current.clientWidth : 1000;
    const left = Math.max(56, Math.min(rect.left, surfaceW - 380));
    return { top, left };
  }, [rect]);

  const tagName = selectedEl ? selectedEl.tagName.toLowerCase() : '';
  const capabilities = selectedId ? store.capabilities[selectedId] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Preview &amp; Visual Editor</span>
        <span className={`rounded-full px-2 py-0.5 text-xs ${mode === 'edit' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
          {mode === 'edit' ? 'Edit mode — click an element to select' : 'Browse mode — navigate freely'}
        </span>
        {mode === 'edit' && selectedId && <span className="text-xs text-gray-500">Editing: {selectedId}</span>}
      </div>

      <div ref={surfaceRef} className="relative overflow-hidden rounded-lg border-2 border-gray-200 bg-white" style={{ height: '72vh' }}>
        <EditorSidebar
          mode={mode}
          onToggleEdit={() => setMode(mode === 'edit' ? 'browse' : 'edit')}
          pages={PREVIEWABLE}
          page={page}
          onSelectPage={setPage}
          viewport={viewport}
          onSetViewport={setViewport}
          onExit={() => setMode('browse')}
        />

        {/* Independent page scroll layer (offset for the sidebar) */}
        <div ref={scrollRef} className="absolute inset-0 overflow-auto" style={{ marginLeft: 48 }}>
          <div style={{ width: VIEWPORTS[viewport], maxWidth: '100%', margin: '0 auto' }}>
            <Suspense fallback={<div className="p-12 text-center text-gray-500">Loading page…</div>}>
              <PageComponent />
            </Suspense>
          </div>
        </div>

        {/* Selected element type tag */}
        {mode === 'edit' && rect && selectedId && (
          <div
            className="ve-chrome pointer-events-none absolute z-[60] rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ top: Math.max(0, rect.top - 16), left: Math.max(48, rect.left) }}
          >
            {tagName}
          </div>
        )}

        {/* Contextual toolbar */}
        {mode === 'edit' && selectedId && selectedEl && toolbarStyle && (
          <ContextualToolbar editId={selectedId} element={selectedEl} capabilities={capabilities} style={toolbarStyle} />
        )}

        {/* Save / Cancel — only once a sandbox edit exists */}
        {dirty && (
          <div className="ve-chrome absolute right-3 top-3 z-[75] flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-xl">
            <span className="flex items-center gap-1 text-xs text-amber-600"><AlertTriangle className="h-3.5 w-3.5" /> Unsaved changes</span>
            <button type="button" onClick={cancelEdits} disabled={saving} className="rounded-md border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
              <X className="mr-1 inline h-3.5 w-3.5" />Cancel
            </button>
            <button type="button" onClick={saveEdits} disabled={saving} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
              {saving ? <RefreshCw className="mr-1 inline h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1 inline h-3.5 w-3.5" />}Save Changes
            </button>
          </div>
        )}

        {status && !dirty && (
          <div className={`ve-chrome absolute right-3 top-3 z-[75] flex items-center gap-1 rounded-lg border px-3 py-2 text-xs shadow ${
            status.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}>
            {status.type === 'success' ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{status.msg}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Edits are sandboxed in memory and persist only when you click Save Changes. Only instrumented elements are selectable.
      </p>
    </div>
  );
}
