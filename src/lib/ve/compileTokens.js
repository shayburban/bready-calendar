// Live Visual Editor — pure token compiler (I2).
//
// compileTokens(globalTokens) is PURE: no DOM, no globals, deterministic output.
// It is the SINGLE function that turns config.globalTokens into the CSS that the
// live site uses (via the injector) and that the editor preview would use. Output
// order follows the registry, so snapshots are stable regardless of input order.
//
// The browser passes a real `cssSupports`; Node tests pass a stub. Capabilities
// (here: the registry) are an explicit argument, never read from ambient state.

import { TOKEN_REGISTRY, KNOWN_VE_NAMES } from './tokenRegistry.js';
import { sanitizeTokenValue } from './sanitizer.js';

/**
 * @param {Record<string,string>} globalTokens  map of "--ve-*" -> value
 * @param {object} [opts]
 * @param {(prop:string,val:string)=>boolean} [opts.cssSupports]
 * @param {Array} [opts.registry]
 * @returns {{ cssText:string, diagnostics:Array<{token:string, ok:boolean, reason?:string, value?:string}> }}
 */
export function compileTokens(globalTokens = {}, opts = {}) {
  const { cssSupports, registry = TOKEN_REGISTRY } = opts;
  const tokens = globalTokens && typeof globalTokens === 'object' ? globalTokens : {};
  const knownVeNames = registry === TOKEN_REGISTRY ? KNOWN_VE_NAMES : new Set(registry.map((r) => r.ve));

  const decls = [];
  const diagnostics = [];

  // Deterministic: iterate the registry, not the input.
  for (const reg of registry) {
    if (!Object.prototype.hasOwnProperty.call(tokens, reg.ve)) continue;
    const raw = tokens[reg.ve];
    if (raw == null || String(raw).trim() === '') continue; // unset => fall back to default in index.css

    const res = sanitizeTokenValue({
      kind: reg.kind,
      value: raw,
      cssSupports,
      knownVeNames,
      selfName: reg.ve,
      cap: reg.cap,
    });

    if (!res.ok) {
      diagnostics.push({ token: reg.ve, ok: false, reason: res.reason, value: String(raw) });
      continue;
    }
    decls.push(`  ${reg.ve}: ${res.value};`);
  }

  // Surface unknown keys (present in config but not in the registry) as diagnostics.
  for (const key of Object.keys(tokens)) {
    if (!knownVeNames.has(key)) {
      diagnostics.push({ token: key, ok: false, reason: 'unknown token (not in registry)', value: String(tokens[key]) });
    }
  }

  const cssText = decls.length ? `:root {\n${decls.join('\n')}\n}` : '';
  return { cssText, diagnostics };
}
