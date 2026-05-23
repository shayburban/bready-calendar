// Live Visual Editor — Phase 4/5 editor store (sandbox + commit).
//
// A tiny external store (no deps) consumed via useSyncExternalStore. It holds:
//   - committed: the last-saved config (baseline for Cancel)
//   - draft:     in-memory sandbox edits (NOTHING is persisted until save())
//   - selection / hover / mode for the editor UI
//
// All visual changes are applied by re-injecting the EFFECTIVE override
// (committed ⊕ draft) through the pure compiler/injector — never by mutating
// element.style/className (I1). Save merges draft into committed and persists
// via the Phase 1 config layer (bump revision); Cancel discards the draft and
// restores the committed look.

import { useSyncExternalStore } from 'react';
import { defaultConfig, loadActiveConfig, saveConfig } from './config.js';
import {
  applyElementOverride,
  removeElementOverride,
  writeOverridesWarmCache,
} from './elementStyleInjector.js';

let state = {
  mode: 'browse', // 'browse' | 'edit'
  selectedId: null,
  hoveredId: null,
  committed: defaultConfig(),
  draft: {}, // { [editId]: { variants: { base: { prop: value } } } }
  capabilities: {}, // editId -> Set(allowedProps), discovered from the DOM on select
  loadedRevision: 0,
  saving: false,
  status: null, // { type, msg }
};

const listeners = new Set();
function emit() {
  state = { ...state };
  for (const l of listeners) l();
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function getState() {
  return state;
}

export function useEditorStore() {
  return useSyncExternalStore(subscribe, getState);
}

// committed ⊕ draft (draft wins, per variant, per property)
function effectiveOverride(editId) {
  const c = state.committed.elementOverrides[editId];
  const d = state.draft[editId];
  if (!c && !d) return null;
  const cv = (c && c.variants) || {};
  const dv = (d && d.variants) || {};
  const variants = {};
  for (const k of new Set([...Object.keys(cv), ...Object.keys(dv)])) {
    variants[k] = { ...(cv[k] || {}), ...(dv[k] || {}) };
  }
  return { ...(c || {}), ...(d || {}), variants };
}

function reinject(editId) {
  const ov = effectiveOverride(editId);
  const caps = state.capabilities[editId] || null;
  if (ov) applyElementOverride(editId, ov, { allowedProperties: caps });
  else removeElementOverride(editId);
}

// ---- actions ---------------------------------------------------------------

export async function initEditorFromConfig() {
  const { config } = await loadActiveConfig();
  state = { ...state, committed: config, loadedRevision: config.revision, draft: {} };
  emit();
}

export function setMode(mode) {
  state = { ...state, mode, selectedId: mode === 'browse' ? null : state.selectedId, hoveredId: null };
  emit();
}

export function selectElement(editId, capabilitySet) {
  state = {
    ...state,
    selectedId: editId,
    capabilities: capabilitySet ? { ...state.capabilities, [editId]: capabilitySet } : state.capabilities,
  };
  emit();
}

export function deselect() {
  if (state.selectedId == null && state.hoveredId == null) return;
  state = { ...state, selectedId: null };
  emit();
}

export function setHover(editId) {
  if (state.hoveredId === editId) return;
  state = { ...state, hoveredId: editId };
  emit();
}

export function setDraftProperty(editId, property, value, variant = 'base') {
  const cur = state.draft[editId] || { variants: {} };
  const variants = { ...cur.variants, [variant]: { ...(cur.variants[variant] || {}), [property]: value } };
  state = { ...state, draft: { ...state.draft, [editId]: { ...cur, variants } } };
  reinject(editId);
  emit();
}

export function resetDraftProperty(editId, property, variant = 'base') {
  const cur = state.draft[editId];
  if (!cur || !cur.variants[variant]) return;
  const v = { ...cur.variants[variant] };
  delete v[property];
  const variants = { ...cur.variants, [variant]: v };
  if (Object.keys(v).length === 0) delete variants[variant];
  const nextDraftForId = { ...cur, variants };
  const draft = { ...state.draft };
  if (Object.keys(variants).length === 0) delete draft[editId];
  else draft[editId] = nextDraftForId;
  state = { ...state, draft };
  reinject(editId);
  emit();
}

export function isDirty() {
  return Object.keys(state.draft).length > 0;
}

export function cancelEdits() {
  const touched = Object.keys(state.draft);
  state = { ...state, draft: {}, status: null };
  for (const id of touched) {
    const committedOv = state.committed.elementOverrides[id];
    if (committedOv) applyElementOverride(id, committedOv, { allowedProperties: state.capabilities[id] || null });
    else removeElementOverride(id);
  }
  emit();
}

export async function saveEdits() {
  state = { ...state, saving: true, status: null };
  emit();

  const mergedOverrides = { ...state.committed.elementOverrides };
  for (const [id, dov] of Object.entries(state.draft)) {
    const base = mergedOverrides[id] || { variants: {} };
    const variants = { ...base.variants };
    for (const [vk, decls] of Object.entries(dov.variants || {})) {
      variants[vk] = { ...(variants[vk] || {}), ...decls };
    }
    mergedOverrides[id] = { ...base, ...dov, variants };
  }

  const next = { ...state.committed, elementOverrides: mergedOverrides };
  const res = await saveConfig(next, state.loadedRevision);

  if (res.ok) {
    writeOverridesWarmCache(res.config.elementOverrides);
    state = {
      ...state,
      committed: res.config,
      loadedRevision: res.config.revision,
      draft: {},
      saving: false,
      status: { type: 'success', msg: `Saved (revision ${res.config.revision}).` },
    };
  } else if (res.conflict) {
    state = {
      ...state,
      saving: false,
      status: { type: 'error', msg: `Another admin saved (revision ${res.currentRevision}). Reload before saving — nothing was overwritten.` },
    };
  } else {
    state = { ...state, saving: false, status: { type: 'error', msg: 'Save failed. Your edits are kept — try again.' } };
  }
  emit();
  return res;
}

// Read the effective value an editor control should show for a property.
export function draftValue(editId, property, variant = 'base') {
  const d = state.draft[editId];
  if (d && d.variants[variant] && property in d.variants[variant]) return d.variants[variant][property];
  const c = state.committed.elementOverrides[editId];
  if (c && c.variants[variant] && property in c.variants[variant]) return c.variants[variant][property];
  return undefined;
}
