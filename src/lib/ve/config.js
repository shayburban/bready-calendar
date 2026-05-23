// Live Visual Editor — config load/save (Part 0 data model + Part 9 saving).
//
// ONE forward-compatible JSON document is the single source of truth. Phase 1
// only reads/writes `globalTokens`; `elementOverrides` is carried through
// untouched so later phases share the same doc.
//
// Persistence goes through the existing entity abstraction (SystemDesignConfig),
// which is currently the in-memory mock. The Supabase switch (real durability +
// server-side compare-and-swap for I7) is a confirmed follow-up; see SUPABASE
// note on saveConfig. Until then, the revision check below is BEST-EFFORT (I7).

import { SystemDesignConfig } from '@/api/entities';

export const SCHEMA_VERSION = 1;

export function defaultConfig() {
  return {
    schemaVersion: SCHEMA_VERSION,
    revision: 0,
    updatedAt: null,
    globalTokens: {},
    elementOverrides: {},
  };
}

// Null/partial/garbage config -> defaults, never crash (I5).
export function normalizeConfig(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  return {
    schemaVersion: typeof c.schemaVersion === 'number' ? c.schemaVersion : SCHEMA_VERSION,
    revision: typeof c.revision === 'number' ? c.revision : 0,
    updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : null,
    globalTokens: c.globalTokens && typeof c.globalTokens === 'object' ? { ...c.globalTokens } : {},
    elementOverrides: c.elementOverrides && typeof c.elementOverrides === 'object' ? c.elementOverrides : {},
  };
}

/** @returns {Promise<{ row: any|null, config: ReturnType<typeof defaultConfig> }>} */
export async function loadActiveConfig() {
  try {
    const rows = await SystemDesignConfig.filter({ isActive: true });
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return { row, config: normalizeConfig(row && row.config) };
  } catch (e) {
    // Unreachable backend => site renders with defaults (I5).
    console.error('[ve] loadActiveConfig failed:', e);
    return { row: null, config: defaultConfig() };
  }
}

/**
 * Persist a new config version with best-effort optimistic concurrency.
 *
 * SUPABASE (follow-up): replace the deactivate+create dance with a single
 * UPDATE ... WHERE revision = $loadedRevision (true CAS) so I7 becomes a hard
 * invariant. The mock cannot do atomic CAS, hence "best-effort" here.
 *
 * @param {object} nextConfig   the full config to save (globalTokens etc.)
 * @param {number} loadedRevision  revision the editor loaded; rejected on drift
 * @returns {Promise<{ok:true,row:any,config:object} | {ok:false,conflict:true,currentRevision:number} | {ok:false,error:Error}>}
 */
export async function saveConfig(nextConfig, loadedRevision) {
  try {
    const { config: current } = await loadActiveConfig();

    if (typeof loadedRevision === 'number' && current.revision !== loadedRevision) {
      return { ok: false, conflict: true, currentRevision: current.revision };
    }

    const toSave = {
      ...normalizeConfig(nextConfig),
      schemaVersion: SCHEMA_VERSION,
      revision: (current.revision || 0) + 1,
      updatedAt: new Date().toISOString(),
    };

    // Mirror the existing AdminSystemDesign save pattern: deactivate then create.
    const existing = await SystemDesignConfig.list();
    for (const c of existing) {
      if (c && c.isActive) {
        await SystemDesignConfig.update(c.id, { isActive: false });
      }
    }
    const row = await SystemDesignConfig.create({
      configName: `VE Config ${toSave.updatedAt}`,
      config: toSave,
      isActive: true,
    });

    return { ok: true, row, config: toSave };
  } catch (error) {
    console.error('[ve] saveConfig failed:', error);
    return { ok: false, error };
  }
}
