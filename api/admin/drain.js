// Admin drain control — ONE function (Hobby caps a deployment at 12 functions, so
// the four admin actions are consolidated here). Admin-only (server-side JWT role
// check). Never exposes/logs CRON_SECRET.
//
//   GET                                  -> status/metrics for the panel
//   POST { action: 'trigger-mode', mode } -> set trigger_mode + (un)schedule pg_cron
//   POST { action: 'drain-enabled', enabled } -> pause/resume
//   POST { action: 'drain-now' }          -> run one drain immediately

import { admin, requireAdmin } from '../../lib-server/supabaseAdmin.js';
import { runDrain } from '../../lib-server/drain.js';
import { json, error, readJson } from '../../lib-server/http.js';

async function status() {
  const a = admin();
  const [settings, pend, oldest, dead, proc, lastRun, sched] = await Promise.all([
    a.from('system_settings').select('trigger_mode, drain_enabled, updated_at').eq('id', 1).single(),
    a.from('calendar_outbox').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    a.from('calendar_outbox').select('created_at').eq('status', 'pending').order('created_at', { ascending: true }).limit(1),
    a.from('calendar_outbox').select('id', { count: 'exact', head: true }).eq('status', 'failed_permanent'),
    a.from('calendar_outbox').select('id', { count: 'exact', head: true }).eq('status', 'processing'),
    a.from('drain_runs').select('*').order('started_at', { ascending: false }).limit(1),
    a.rpc('external_trigger_scheduled'),
  ]);
  return {
    triggerMode: settings.data?.trigger_mode ?? 'external',
    drainEnabled: settings.data?.drain_enabled ?? true,
    externalScheduled: sched.data === true,
    backlog: {
      pending: pend.count || 0,
      processing: proc.count || 0,
      deadLettered: dead.count || 0,
      oldestPendingAt: oldest.data?.[0]?.created_at || null,
    },
    lastRun: lastRun.data?.[0] || null,
  };
}

export default {
  async fetch(request) {
    if (!(await requireAdmin(request))) return error('forbidden', 403);

    if (request.method === 'GET') return json(await status());
    if (request.method !== 'POST') return error('method not allowed', 405);

    const body = await readJson(request);
    const a = admin();

    switch (body?.action) {
      case 'trigger-mode': {
        const mode = body.mode;
        if (mode !== 'external' && mode !== 'native') return error('mode must be "external" or "native"', 400);
        await a.from('system_settings').update({ trigger_mode: mode, updated_at: new Date().toISOString() }).eq('id', 1);
        // External => pg_cron POSTs every 2 min. Native => unschedule (the native
        // Vercel cron you add at cutover becomes authoritative). Does NOT touch billing.
        if (mode === 'external') await a.rpc('enable_external_trigger');
        else await a.rpc('disable_external_trigger');
        const { data: scheduled } = await a.rpc('external_trigger_scheduled');
        return json({ ok: true, triggerMode: mode, externalScheduled: scheduled === true });
      }
      case 'drain-enabled': {
        if (typeof body.enabled !== 'boolean') return error('enabled must be a boolean', 400);
        await a.from('system_settings').update({ drain_enabled: body.enabled, updated_at: new Date().toISOString() }).eq('id', 1);
        return json({ ok: true, drainEnabled: body.enabled });
      }
      case 'drain-now': {
        try {
          return json(await runDrain({ source: 'manual' }));
        } catch (e) {
          return error('drain failed', 500, { detail: String(e?.message || e).slice(0, 200) });
        }
      }
      default:
        return error('unknown action', 400);
    }
  },
};
