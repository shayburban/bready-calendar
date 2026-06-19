// Storage adapters behind a common { load, save, clear } interface.
//   - localStorage adapter: synchronous safety net; degrades to an in-memory
//     Map + warning on QuotaExceededError so a full quota never kills autosave.
//   - Supabase draft adapter: cross-device resume via upsert-by-user_id with a
//     monotonic `version`; lightweight non-blocking retry; a keepalive REST
//     writer for unload (sendBeacon can't attach Supabase's apikey/Authorization).
import { persistenceManager } from '@/components/common/PersistenceManager';
import { supabase } from '@/api/supabaseClient';

const LS_PREFIX = 'teacher_reg_';

// ---------------------------------------------------------------------------
// localStorage adapter
// ---------------------------------------------------------------------------
export function createLocalStorageAdapter({ onQuotaWarning } = {}) {
  let degraded = false;
  const memory = new Map();

  async function save(snapshot, meta) {
    if (degraded) {
      memory.set('payload', { snapshot, ...meta });
      return { ok: true, degraded: true };
    }
    try {
      await persistenceManager.save('formData', snapshot);
      await persistenceManager.save('currentStep', meta.currentStep);
      await persistenceManager.save('currentSubStep', meta.currentSubStep);
      return { ok: true };
    } catch (e) {
      degraded = true;
      memory.set('payload', { snapshot, ...meta });
      if (onQuotaWarning) { try { onQuotaWarning(e); } catch { /* noop */ } }
      return { ok: false, degraded: true, error: e };
    }
  }

  // Synchronous write for unload paths — the real refresh-safety guarantee.
  function saveSync(snapshot, meta) {
    try {
      localStorage.setItem(`${LS_PREFIX}formData`, JSON.stringify(snapshot));
      localStorage.setItem(`${LS_PREFIX}currentStep`, JSON.stringify(meta.currentStep));
      localStorage.setItem(`${LS_PREFIX}currentSubStep`, JSON.stringify(meta.currentSubStep));
      return true;
    } catch {
      degraded = true;
      memory.set('payload', { snapshot, ...meta });
      return false;
    }
  }

  async function load() {
    if (degraded && memory.has('payload')) {
      const p = memory.get('payload');
      return { snapshot: p.snapshot || null, currentStep: p.currentStep ?? 1, currentSubStep: p.currentSubStep ?? 1 };
    }
    const snapshot = await persistenceManager.get('formData');
    const currentStep = await persistenceManager.get('currentStep', 1);
    const currentSubStep = await persistenceManager.get('currentSubStep', 1);
    return { snapshot: snapshot || null, currentStep, currentSubStep };
  }

  async function clear() {
    memory.clear();
    await persistenceManager.clear();
  }

  return { save, saveSync, load, clear, isDegraded: () => degraded };
}

// ---------------------------------------------------------------------------
// Supabase draft adapter
// ---------------------------------------------------------------------------
export function createSupabaseDraftAdapter() {
  // Cache identity + JWT so the unload keepalive write can run synchronously
  // (getSession() is async and unavailable mid-unload).
  let cachedUserId = null;
  let cachedToken = null;

  supabase.auth.getSession().then(({ data: { session } }) => {
    cachedUserId = session?.user?.id || null;
    cachedToken = session?.access_token || null;
  }).catch(() => {});
  supabase.auth.onAuthStateChange((_e, session) => {
    cachedUserId = session?.user?.id || null;
    cachedToken = session?.access_token || null;
  });

  async function getUserId() {
    if (cachedUserId) return cachedUserId;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      cachedUserId = session?.user?.id || null;
      cachedToken = session?.access_token || cachedToken;
      return cachedUserId;
    } catch {
      return null;
    }
  }

  async function load() {
    const userId = await getUserId();
    if (!userId) return { ok: false, reason: 'no-session', data: null };
    try {
      const { data, error } = await supabase
        .from('teacher_registration_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return { ok: true, data: data || null };
    } catch (e) {
      console.warn('[draftAdapter] load failed:', e?.message || e);
      return { ok: false, reason: e?.message || 'error', data: null };
    }
  }

  async function save(snapshot, meta) {
    const userId = await getUserId();
    if (!userId) return { ok: false, reason: 'no-session' };

    const row = {
      user_id: userId,
      form_data: snapshot,
      current_step: meta.currentStep,
      current_sub_step: meta.currentSubStep,
      version: meta.version ?? 0,
      updated_date: new Date().toISOString(),
    };

    const attempt = async () => {
      const { error } = await supabase
        .from('teacher_registration_drafts')
        .upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    };

    try {
      await attempt();
      return { ok: true };
    } catch (e1) {
      // one lightweight retry, non-blocking; localStorage remains the safety net
      await new Promise((r) => setTimeout(r, 400));
      try {
        await attempt();
        return { ok: true };
      } catch (e2) {
        console.warn('[draftAdapter] save failed:', e2?.message || e2);
        return { ok: false, reason: e2?.message || 'error' };
      }
    }
  }

  // Best-effort unload write. Uses keepalive fetch with the cached JWT because
  // Supabase requires apikey + Authorization headers that sendBeacon can't set.
  function saveKeepalive(snapshot, meta) {
    try {
      if (!cachedUserId || !cachedToken) return false;
      const url = import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
      fetch(`${url}/rest/v1/teacher_registration_drafts?on_conflict=user_id`, {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: anon,
          Authorization: `Bearer ${cachedToken}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: cachedUserId,
          form_data: snapshot,
          current_step: meta.currentStep,
          current_sub_step: meta.currentSubStep,
          version: meta.version ?? 0,
          updated_date: new Date().toISOString(),
        }),
      }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  async function markSubmitted() {
    const userId = await getUserId();
    if (!userId) return;
    try {
      await supabase
        .from('teacher_registration_drafts')
        .update({ submitted: true, updated_date: new Date().toISOString() })
        .eq('user_id', userId);
    } catch { /* best-effort */ }
  }

  return { load, save, saveKeepalive, markSubmitted, hasSession: () => !!cachedUserId };
}

// ---------------------------------------------------------------------------
// Initial load + conflict resolution: read both tiers, pick the winner.
// ---------------------------------------------------------------------------
export async function loadInitialDraft(localAdapter, remoteAdapter) {
  const local = await localAdapter.load();
  const remote = await remoteAdapter.load();

  const remoteRow = remote.ok ? remote.data : null;
  const hasRemote = !!(remoteRow && !remoteRow.submitted && remoteRow.form_data &&
    Object.keys(remoteRow.form_data).length > 0);
  const hasLocal = !!(local.snapshot && Object.keys(local.snapshot).length > 0);

  // Submitted remote → don't drop a finished teacher back into the wizard.
  if (remoteRow?.submitted) {
    return { snapshot: null, currentStep: 1, currentSubStep: 1, version: remoteRow.version ?? 0, source: 'submitted', hasConflict: false };
  }

  if (hasRemote && hasLocal) {
    // Both exist → freshness wins; flag a meaningful divergence for a prompt.
    const remoteTime = new Date(remoteRow.updated_at || remoteRow.updated_date || 0).getTime();
    const localTime = 0; // localStorage has no timestamp; treat remote as canonical unless local differs
    const localStr = JSON.stringify(local.snapshot);
    const remoteStr = JSON.stringify(remoteRow.form_data);
    const diverged = localStr !== remoteStr;
    // Prefer remote (cross-device truth); surface the choice when they differ.
    return {
      snapshot: remoteRow.form_data,
      currentStep: remoteRow.current_step ?? local.currentStep ?? 1,
      currentSubStep: remoteRow.current_sub_step ?? local.currentSubStep ?? 1,
      version: remoteRow.version ?? 0,
      source: 'remote',
      hasConflict: diverged,
      localSnapshot: local.snapshot,
      localStep: local.currentStep,
      localSubStep: local.currentSubStep,
      remoteTime,
      localTime,
    };
  }

  if (hasRemote) {
    return {
      snapshot: remoteRow.form_data,
      currentStep: remoteRow.current_step ?? 1,
      currentSubStep: remoteRow.current_sub_step ?? 1,
      version: remoteRow.version ?? 0,
      source: 'remote',
      hasConflict: false,
    };
  }

  if (hasLocal) {
    return {
      snapshot: local.snapshot,
      currentStep: local.currentStep ?? 1,
      currentSubStep: local.currentSubStep ?? 1,
      version: 0,
      source: 'local',
      hasConflict: false,
    };
  }

  return { snapshot: null, currentStep: 1, currentSubStep: 1, version: 0, source: 'none', hasConflict: false };
}
