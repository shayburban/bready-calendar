// Live Visual Editor — client bootstrap (replaces the SSR fetch path).
//
// Two-stage, FOUC-minimizing startup:
//   1) bootstrapTokens()  — synchronous, called BEFORE React renders. Reads the
//      warm cache and injects the token <style> immediately. No await, no crash
//      if storage/DOM is unavailable.
//   2) reconcileTokensFromBackend() — fire-and-forget AFTER render. Fetches the
//      authoritative config, re-applies tokens, refreshes the warm cache.
//
// On a cold first visit (empty cache) there is a brief unstyled flash before the
// backend responds — accepted + documented [FALLBACK]; warm cache makes repeat
// visits near-imperceptible. Any failure leaves the site at its defaults (I5).

import { applyGlobalTokens, readWarmCache, writeWarmCache } from './tokenStyleManager.js';
import {
  applyAllOverrides,
  clearAllElementStyles,
  readOverridesWarmCache,
  writeOverridesWarmCache,
} from './elementStyleInjector.js';
import { loadActiveConfig } from './config.js';

// Declare the override cascade layer as the first <head> node so ve-overrides
// rules participate predictably (Part 3.2). Idempotent.
export function ensureOverridesLayer() {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.getElementById('ve-layer-order')) return;
  const el = document.createElement('style');
  el.id = 've-layer-order';
  el.textContent = '@layer ve-overrides;';
  document.head.insertBefore(el, document.head.firstChild);
}

export function bootstrapTokens() {
  try {
    ensureOverridesLayer();
    applyGlobalTokens(readWarmCache());
    applyAllOverrides(readOverridesWarmCache());
  } catch (e) {
    console.error('[ve] bootstrapTokens failed (site falls back to defaults):', e);
  }
}

export async function reconcileTokensFromBackend() {
  try {
    const { row, config } = await loadActiveConfig();
    // Authoritative ONLY when the backend actually holds a persisted config doc.
    // The current backend is the in-memory mock, whose seed row has no `.config`,
    // so until the Supabase switch we must NOT let an empty backend clobber the
    // admin's last local save (warm cache) — that would revert tokens on reload.
    // A real Supabase save carries a `config` blob, so it stays authoritative
    // (and multi-user) the moment that backend is wired.
    const backendHasConfig = !!(row && row.config && typeof row.config === 'object');
    if (backendHasConfig) {
      applyGlobalTokens(config.globalTokens);
      writeWarmCache(config.globalTokens);
      clearAllElementStyles();
      applyAllOverrides(config.elementOverrides);
      writeOverridesWarmCache(config.elementOverrides);
      return config;
    }
    return null; // keep tokens + overrides already applied from the warm cache
  } catch (e) {
    console.error('[ve] reconcileTokensFromBackend failed:', e);
    return null;
  }
}
