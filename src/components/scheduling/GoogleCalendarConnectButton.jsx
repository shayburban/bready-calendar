// Reusable "Connect Google Calendar" control. For students this is OUTBOUND ONLY
// (booked lessons appear in their Google Calendar; we never import their events
// and never create a watch channel — docs/google-calendar-sync-v1.md §2/§D).
// For teachers it also enables inbound "Busy" warnings.

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleConnectionStatus,
} from '@/api/googleCalendar';

export default function GoogleCalendarConnectButton({ role = 'student', className = '' }) {
  const [connected, setConnected] = useState(null); // null = unknown/loading
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    // Role-agnostic status (zero Google calls) — correct for students, who have
    // no inbound and so never report "connected" via freebusy-overlaps.
    getGoogleConnectionStatus().then((r) => {
      if (alive) setConnected(!!r.connected);
    });
    return () => { alive = false; };
  }, []);

  const onClick = async () => {
    setBusy(true);
    try {
      if (connected) {
        await disconnectGoogleCalendar();
        setConnected(false);
      } else {
        await connectGoogleCalendar(role); // redirects to Google
      }
    } catch {
      /* the connect flow surfaces its own errors */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={connected ? 'default' : 'outline'}
      size="sm"
      disabled={busy}
      onClick={onClick}
      className={className}
      title={
        connected
          ? 'Google Calendar connected — click to disconnect'
          : 'Connect Google Calendar so your booked lessons appear there'
      }
    >
      <Calendar className="w-4 h-4 mr-2" />
      {connected ? 'Google Calendar ✓' : 'Connect Google Calendar'}
    </Button>
  );
}
