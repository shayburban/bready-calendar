// In-app "Connect Google Calendar" card. Replaces the dead-end alert: it detects
// whether you actually have a Supabase session and walks you through the two real
// steps without making you hunt for a hidden top-right Login.
//
//   1. SIGNED OUT  → "Sign in with Google" (Supabase OIDC login; you return here).
//   2. SIGNED IN, not connected → "Connect Google Calendar" (the dedicated backend
//      OAuth at /api/google/oauth-start — separate calendar-scope consent).
//   3. CONNECTED   → shows status + Disconnect.
//
// The Google consent screen itself is a Google page (that's how OAuth works — it
// can't be skipped), but everything else stays in this card.

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleConnectionStatus,
} from '@/api/googleCalendar';

export default function GoogleCalendarConnectDialog({ open, onOpenChange, role = 'teacher' }) {
  const [state, setState] = useState('loading'); // loading | signedOut | notConnected | connected | error
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.access_token) {
        setState('signedOut');
        return;
      }
      const status = await getGoogleConnectionStatus();
      setState(status?.connected ? 'connected' : 'notConnected');
    } catch (e) {
      setError(e?.message || String(e));
      setState('error');
    }
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  // Step 1 — establish a real Supabase session via Google (returns to this page).
  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const { error: e } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href },
      });
      if (e) throw e;
      // browser redirects to Google here
    } catch (e) {
      setError(e?.message || 'Could not start Google sign-in.');
      setBusy(false);
    }
  };

  // Step 2 — the dedicated calendar-scope OAuth (backend flow; redirects to Google).
  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      await connectGoogleCalendar(role); // redirects to Google's consent
    } catch (e) {
      setError(e?.message || 'Could not start the calendar connection.');
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await disconnectGoogleCalendar();
      await refresh();
    } catch (e) {
      setError(e?.message || 'Could not disconnect.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Google Calendar Sync
          </DialogTitle>
        </DialogHeader>

        {state === 'loading' && (
          <div className="py-6 flex items-center justify-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Checking your connection…
          </div>
        )}

        {state === 'signedOut' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              To sync your Google Calendar you first need to <strong>sign in with your Google
              account</strong>. You're currently in a local preview (no signed-in account), so
              there's nothing to attach the calendar to yet. You'll come right back here after.
            </p>
            <Button disabled={busy} onClick={signIn} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {busy ? 'Redirecting to Google…' : 'Sign in with Google'}
            </Button>
          </div>
        )}

        {state === 'notConnected' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Connect your Google Calendar so your booked lessons appear there, and your external
              busy times show up as warnings while you open availability.
            </p>
            <Button disabled={busy} onClick={connect} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {busy ? 'Redirecting to Google…' : 'Connect Google Calendar'}
            </Button>
            <p className="text-xs text-gray-400">
              You'll briefly go to Google's consent screen to approve access, then return here.
            </p>
          </div>
        )}

        {state === 'connected' && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5" /> Your Google Calendar is connected and syncing.
            </p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={disconnect}
              className="w-full border-red-300 text-red-600 hover:bg-red-50"
            >
              {busy ? 'Working…' : 'Disconnect'}
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error || 'Something went wrong.'}
            </p>
            <Button variant="outline" onClick={refresh} className="w-full">Try again</Button>
          </div>
        )}

        {error && state !== 'error' && <p className="text-xs text-red-600">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
