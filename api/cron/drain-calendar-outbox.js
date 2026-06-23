// GET|POST /api/cron/drain-calendar-outbox  — TRIGGER-AGNOSTIC drain.
//   GET  = native Vercel cron (Pro phase)
//   POST = external pg_cron + pg_net (Hobby phase) OR the admin "Drain now" button
// Auth: Authorization: Bearer ${CRON_SECRET} (401 otherwise; the secret is never
// logged). When drain_enabled=false the core returns { skipped } with HTTP 200 so
// the trigger stays green. maxDuration is set in vercel.json (non-Next functions).

import { runDrain } from '../../lib-server/drain.js';
import { json, error, isAuthorizedCron } from '../../lib-server/http.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'POST') return error('method not allowed', 405);
    if (!isAuthorizedCron(request)) return error('unauthorized', 401);

    const source = request.method === 'GET' ? 'native' : 'external';
    try {
      const summary = await runDrain({ source });
      return json(summary);
    } catch (e) {
      return error('drain failed', 500, { detail: String(e?.message || e).slice(0, 200) });
    }
  },
};
