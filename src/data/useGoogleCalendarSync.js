// useGoogleCalendarSync — teacher-only live inbound "Busy" overlays.
//
// On mount: one freebusy read (view-open). Then subscribes to the teacher's own
// calendar_sync_state row via Supabase Realtime; when an external change lands
// (dirty_at bumps), it DEBOUNCES ~2.5s (coalescing bursts) and refetches. If no
// dashboard is open, nothing is fetched. Returns synced events in the calendar's
// existing shape so they flow through syncedNoteForDay unchanged. Names are "Busy"
// (R15g). See docs/google-calendar-sync-v1.md §3.

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { fetchFreebusyOverlaps, subscribeCalendarSyncState } from '@/api/googleCalendar';
import { freebusyToSyncedEvents } from '@/lib/freebusyToSyncedEvents';

const DEBOUNCE_MS = 2500;

export function useGoogleCalendarSync({ enabled = true } = {}) {
  const [syncedEvents, setSyncedEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let unsub = () => {};

    const load = async (reason) => {
      const r = await fetchFreebusyOverlaps(reason);
      if (cancelled) return;
      setConnected(!!r.connected);
      setSyncedEvents(r.connected ? freebusyToSyncedEvents(r.intervals) : []);
    };

    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      await load('view-open');
      if (cancelled || !userId) return;
      unsub = subscribeCalendarSyncState(userId, () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => load('dirty-refetch'), DEBOUNCE_MS);
      });
    })();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      unsub();
    };
  }, [enabled]);

  return { syncedEvents, connected };
}
