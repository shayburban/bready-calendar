// Live Visual Editor — global-token style injector (Part 1.C / Part 7).
//
// Owns a single <style id="ve-global-tokens"> tag, kept as the FIRST <head>
// child and managed OUTSIDE the React tree. There is no SSR in this app, so the
// "inject at SSR" invariant becomes a client-bootstrap equivalent: a warm cache
// in localStorage lets us inject synchronously before first paint; the
// authoritative config reconciles right after mount.
//
// All values flow through the pure compiler (which sanitizes), so this module
// never emits unvalidated CSS.

import { compileTokens } from './compileTokens.js';

const STYLE_ID = 've-global-tokens';
export const WARM_CACHE_KEY = 've:warm:globalTokens:v1';

const hasDom = () => typeof document !== 'undefined' && !!document.head;

// Browser-native syntactic check. CSS.supports is parse-only and ignores host
// stylesheets, so it cannot be biased by the page. Falls back to "allow" only
// when CSS.supports is entirely unavailable (the string blacklist still applies).
function cssSupports(prop, val) {
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    try { return CSS.supports(prop, val); } catch { return false; }
  }
  return true;
}

function ensureStyleEl() {
  if (!hasDom()) return null;
  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    el.setAttribute('data-ve', 'global-tokens');
    document.head.insertBefore(el, document.head.firstChild);
  } else if (document.head.firstChild !== el) {
    // Loudly warn if something pushed us out of first position (cascade risk),
    // then restore it.
    console.warn('[ve] ve-global-tokens was not the first <head> child; restoring.');
    document.head.insertBefore(el, document.head.firstChild);
  }
  return el;
}

/**
 * Compile + inject global tokens. Returns diagnostics (rejected values + reasons).
 * @param {Record<string,string>} globalTokens
 */
export function applyGlobalTokens(globalTokens) {
  const { cssText, diagnostics } = compileTokens(globalTokens || {}, { cssSupports });
  const el = ensureStyleEl();
  if (el && el.textContent !== cssText) {
    el.textContent = cssText; // single rule — reparse cost is negligible
  }
  return diagnostics;
}

export function readWarmCache() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(WARM_CACHE_KEY) : null;
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeWarmCache(globalTokens) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WARM_CACHE_KEY, JSON.stringify(globalTokens || {}));
    }
  } catch {
    /* quota / private mode — non-fatal, the post-mount fetch still applies tokens */
  }
}
