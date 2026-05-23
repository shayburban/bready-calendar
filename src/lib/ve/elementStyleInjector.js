// Live Visual Editor — Phase 3 per-element style injector (Part 7).
//
// One <style data-ve="<editId>"> per element with overrides, lazy-created and
// removed on deletion, living in <head> and managed OUTSIDE the React tree.
// All CSS flows through the pure compiler (which sanitizes) — this module never
// emits unvalidated CSS and never touches element.style/className (I1).
//
// Also owns a small localStorage warm cache for element overrides (parallel to
// the token warm cache) so per-browser edits survive reload until the durable
// Supabase backend is wired.

import { compileElement } from './compileElement.js';
import { cssSupports } from './cssSupports.js';

const TAG_ATTR = 'data-ve';
export const OVERRIDES_WARM_KEY = 've:warm:elementOverrides:v1';

const tags = new Map(); // editId -> <style> element

function ensureTag(editId) {
  if (typeof document === 'undefined' || !document.head) return null;
  let el = tags.get(editId);
  if (!el) {
    el = document.createElement('style');
    el.setAttribute(TAG_ATTR, editId);
    document.head.appendChild(el);
    tags.set(editId, el);
  }
  return el;
}

/** Compile + inject one element's override. Empty -> remove the tag. */
export function applyElementOverride(editId, override, opts = {}) {
  const { cssText, diagnostics } = compileElement(editId, override, { cssSupports, ...opts });
  if (!cssText) {
    removeElementOverride(editId);
    return diagnostics;
  }
  const el = ensureTag(editId);
  if (el && el.textContent !== cssText) el.textContent = cssText;
  return diagnostics;
}

export function removeElementOverride(editId) {
  const el = tags.get(editId);
  if (el) {
    el.remove();
    tags.delete(editId);
  }
}

export function clearAllElementStyles() {
  for (const el of tags.values()) el.remove();
  tags.clear();
}

/** Apply a whole map of { editId -> override }. */
export function applyAllOverrides(elementOverrides, opts = {}) {
  for (const [editId, override] of Object.entries(elementOverrides || {})) {
    applyElementOverride(editId, override, opts);
  }
}

export function readOverridesWarmCache() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(OVERRIDES_WARM_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeOverridesWarmCache(elementOverrides) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OVERRIDES_WARM_KEY, JSON.stringify(elementOverrides || {}));
    }
  } catch {
    /* non-fatal */
  }
}
