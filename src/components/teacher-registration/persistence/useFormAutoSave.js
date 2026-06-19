// Centralized autosave engine for the registration wizard.
//
// One hook owns all persistence: change-detection (never write an identical
// snapshot twice), dual-cadence debounce (cheap frequent local, lighter
// backend), a single-flight backend queue (latest snapshot wins), synchronous
// flush at step boundaries / unload, optimistic `version` bumps, and a status
// signal for a small UI indicator.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createLocalStorageAdapter, createSupabaseDraftAdapter, loadInitialDraft } from './storageAdapters';
import { fingerprint } from './serialize';

const LOCAL_DEBOUNCE_MS = 400;
const REMOTE_DEBOUNCE_MS = 1500;

export function useFormAutoSave({ snapshot, currentStep, currentSubStep, enabled = true }) {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error | offline
  const [quotaWarning, setQuotaWarning] = useState(false);

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  if (!localRef.current) localRef.current = createLocalStorageAdapter({ onQuotaWarning: () => setQuotaWarning(true) });
  if (!remoteRef.current) remoteRef.current = createSupabaseDraftAdapter();

  const versionRef = useRef(0);
  const lastLocalFp = useRef(null);
  const lastRemoteFp = useRef(null);
  const localTimer = useRef(null);
  const remoteTimer = useRef(null);
  const inFlight = useRef(false);
  const pending = useRef(null);

  // Mirror latest values into a ref so unload handlers see current data.
  const latest = useRef({ snapshot, currentStep, currentSubStep });
  latest.current = { snapshot, currentStep, currentSubStep };

  const meta = useCallback(() => ({
    currentStep: latest.current.currentStep,
    currentSubStep: latest.current.currentSubStep,
    version: versionRef.current,
  }), []);

  // Drain the backend queue, one write at a time; latest pending snapshot wins.
  const runRemote = useCallback(async function runRemote() {
    if (inFlight.current) return;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    inFlight.current = true;
    setStatus('saving');

    const nextVersion = versionRef.current + 1;
    const res = await remoteRef.current.save(job.snapshot, { ...job.meta, version: nextVersion });
    inFlight.current = false;

    if (res.ok) {
      versionRef.current = nextVersion;
      lastRemoteFp.current = job.fp;
      setStatus('saved');
    } else if (res.reason === 'no-session') {
      setStatus('idle'); // guest → localStorage only, by design
    } else {
      setStatus(typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error');
    }

    if (pending.current) runRemote(); // a newer snapshot queued while in flight
  }, []);

  // Schedule saves whenever the (content-changed) snapshot changes.
  useEffect(() => {
    if (!enabled || !snapshot) return undefined;
    const fp = fingerprint(snapshot);
    if (fp === lastLocalFp.current && fp === lastRemoteFp.current) return undefined; // no-op skip

    if (fp !== lastLocalFp.current) {
      clearTimeout(localTimer.current);
      localTimer.current = setTimeout(async () => {
        await localRef.current.save(snapshot, meta());
        lastLocalFp.current = fp;
      }, LOCAL_DEBOUNCE_MS);
    }

    if (fp !== lastRemoteFp.current) {
      pending.current = { snapshot, meta: meta(), fp };
      clearTimeout(remoteTimer.current);
      remoteTimer.current = setTimeout(() => runRemote(), REMOTE_DEBOUNCE_MS);
    }
    return undefined;
  }, [snapshot, enabled, meta, runRemote]);

  // Bypass debounce: write localStorage synchronously + fire backend now.
  const flushSync = useCallback(() => {
    const s = latest.current.snapshot;
    if (!s) return;
    const fp = fingerprint(s);
    clearTimeout(localTimer.current);
    localRef.current.saveSync(s, meta());
    lastLocalFp.current = fp;
    if (fp !== lastRemoteFp.current) {
      clearTimeout(remoteTimer.current);
      pending.current = { snapshot: s, meta: meta(), fp };
      runRemote();
    }
  }, [meta, runRemote]);

  // Survive tab close: synchronous localStorage (the real guarantee) + a
  // best-effort keepalive backend write.
  useEffect(() => {
    const onHide = () => {
      const s = latest.current.snapshot;
      if (!s) return;
      const fp = fingerprint(s);
      localRef.current.saveSync(s, meta());
      lastLocalFp.current = fp;
      if (fp !== lastRemoteFp.current) {
        remoteRef.current.saveKeepalive(s, { ...meta(), version: versionRef.current + 1 });
      }
    };
    const onVis = () => { if (document.visibilityState === 'hidden') onHide(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, [meta]);

  // Persist a freshly-uploaded URL immediately (most expensive thing to lose).
  const persistNow = useCallback((s) => {
    if (!s) return;
    localRef.current.save(s, meta());
    lastLocalFp.current = fingerprint(s);
    pending.current = { snapshot: s, meta: meta(), fp: fingerprint(s) };
    runRemote();
  }, [meta, runRemote]);

  // After hydration, mark the loaded snapshot as already-synced so the first
  // effect run is a no-op (don't immediately re-save what we just loaded).
  const markSynced = useCallback((s) => {
    const fp = fingerprint(s);
    lastLocalFp.current = fp;
    lastRemoteFp.current = fp;
  }, []);

  const setBaseVersion = useCallback((v) => { versionRef.current = v || 0; }, []);
  const loadInitial = useCallback(() => loadInitialDraft(localRef.current, remoteRef.current), []);
  const reconcileRemote = useCallback(() => remoteRef.current.load(), []);
  const clearAll = useCallback(async () => {
    await localRef.current.clear();
    await remoteRef.current.markSubmitted();
  }, []);

  return {
    status, quotaWarning,
    flushSync, persistNow, markSynced, setBaseVersion,
    loadInitial, reconcileRemote, clearAll,
  };
}
