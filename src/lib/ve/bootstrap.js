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
import { loadActiveConfig } from './config.js';

export function bootstrapTokens() {
  try {
    applyGlobalTokens(readWarmCache());
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
      return config;
    }
    return null; // keep what bootstrap already applied from the warm cache
  } catch (e) {
    console.error('[ve] reconcileTokensFromBackend failed:', e);
    return null;
  }
}
