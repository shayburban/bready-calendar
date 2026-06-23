import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Play, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import {
  getDrainStatus,
  setTriggerMode,
  setDrainEnabled,
  runDrainNow,
} from '@/api/adminDrain';

function ago(iso) {
  if (!iso) return '—';
  const ms = Date.now() - Date.parse(iso);
  if (ms < 0) return 'just now';
  const m = Math.floor(ms / 60000);
  if (m < 1) return `${Math.floor(ms / 1000)}s ago`;
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminCalendarSync() {
  const [authState, setAuthState] = useState('checking'); // checking | denied | ok
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getDrainStatus());
      setErr(null);
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me();
        if (me?.role !== 'admin') { setAuthState('denied'); return; }
        setAuthState('ok');
        await refresh();
      } catch {
        setAuthState('denied');
      }
    })();
  }, [refresh]);

  // Light polling so the backlog/last-run panel stays current while open.
  useEffect(() => {
    if (authState !== 'ok') return undefined;
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [authState, refresh]);

  const act = async (fn) => {
    setBusy(true);
    try { await fn(); await refresh(); setErr(null); }
    catch (e) { setErr(String(e?.message || e)); }
    finally { setBusy(false); }
  };

  if (authState === 'checking') return <div className="p-8 text-gray-500">Checking access…</div>;
  if (authState === 'denied') return <div className="p-8 text-red-600">Admin access required.</div>;

  const mode = status?.triggerMode ?? 'external';
  const drainEnabled = status?.drainEnabled ?? true;
  const b = status?.backlog || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar Sync — Outbox Drain</h1>
            <p className="text-sm text-gray-500">Trigger configuration & background-drain health.</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={busy}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {err && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 text-red-700 text-sm p-3">
            <AlertTriangle className="w-4 h-4" /> {err}
          </div>
        )}

        {/* Trigger mode */}
        <Card>
          <CardHeader><CardTitle className="text-base">Trigger mode</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'external' ? 'default' : 'outline'}
                size="sm"
                disabled={busy || mode === 'external'}
                onClick={() => act(() => setTriggerMode('external'))}
              >
                External (Hobby / dev)
              </Button>
              <Button
                variant={mode === 'native' ? 'default' : 'outline'}
                size="sm"
                disabled={busy || mode === 'native'}
                onClick={() => act(() => setTriggerMode('native'))}
              >
                Native (Pro)
              </Button>
              <Badge variant={status?.externalScheduled ? 'default' : 'secondary'} className="ml-2">
                pg_cron: {status?.externalScheduled ? 'scheduled' : 'unscheduled'}
              </Badge>
            </div>

            <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 leading-relaxed">
              <strong>Switching to Native mode unschedules the pg_cron trigger.</strong> You must also
              (1) upgrade your Vercel team to Pro in the Vercel billing dashboard, and (2) add the
              every-2-minutes cron to <code>vercel.json</code> and deploy. <strong>This toggle does NOT
              change your Vercel plan or billing.</strong>
            </div>
            <p className="text-xs text-gray-500">
              External = Supabase pg_cron POSTs the drain endpoint every 2 min (works on Hobby).
              Native = a Vercel cron GETs it every 2 min (requires Pro); pg_cron is unscheduled.
            </p>
          </CardContent>
        </Card>

        {/* Drain enabled + run now */}
        <Card>
          <CardHeader><CardTitle className="text-base">Drain control</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">Drain enabled</div>
                <div className="text-xs text-gray-500">Pause to stop processing; triggers stay green (return “skipped”).</div>
              </div>
              <Switch checked={drainEnabled} disabled={busy} onCheckedChange={(v) => act(() => setDrainEnabled(!!v))} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Run one drain immediately (respects the pause switch).</div>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => act(async () => { setLastRun(await runDrainNow()); })}
              >
                <Play className="w-4 h-4 mr-2" /> Drain now
              </Button>
            </div>
            {lastRun && (
              <div className="text-xs text-gray-600 bg-gray-100 rounded p-2">
                Last manual run: {lastRun.skipped
                  ? `skipped (${lastRun.skipped})`
                  : `claimed ${lastRun.claimed}, ok ${lastRun.succeeded}, retry ${lastRun.failed}, dead ${lastRun.deadLettered} (${lastRun.durationMs}ms)`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status panel */}
        <Card>
          <CardHeader><CardTitle className="text-base">Backlog & last run</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <Stat label="Pending" value={b.pending ?? '—'} />
            <Stat label="Processing" value={b.processing ?? '—'} />
            <Stat label="Dead-letter" value={b.deadLettered ?? '—'} danger={(b.deadLettered ?? 0) > 0} />
            <Stat label="Oldest pending" value={<span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{ago(b.oldestPendingAt)}</span>} />
            <div className="col-span-2 sm:col-span-4">
              <Separator className="my-1" />
              <div className="text-xs text-gray-600 flex items-center justify-center gap-2 pt-2">
                {status?.lastRun ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Last run {ago(status.lastRun.started_at)} via <b>{status.lastRun.source}</b>:
                    claimed {status.lastRun.claimed}, ok {status.lastRun.succeeded}, retry {status.lastRun.failed}, dead {status.lastRun.dead_lettered} ({status.lastRun.duration_ms}ms)
                  </>
                ) : 'No drain runs recorded yet.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, danger }) {
  return (
    <div className="rounded-md bg-white border p-3">
      <div className={`text-2xl font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
