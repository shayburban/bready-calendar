// Surfaces the OUTCOME of every Google round-trip as a toast — so a failed
// sign-in / calendar connect can never again look like "nothing happened".
//
// Two independent Google flows land back here, each leaving a different trace
// in the URL (nothing read either before, hence the silent dead-end):
//
//   1. Supabase Auth "Sign in with Google" (signInWithOAuth). On failure GoTrue
//      bounces straight back with ?error=/&error_description= (query OR #hash) —
//      e.g. provider not enabled, redirect URL not allow-listed. On success the
//      session token is parsed out of the hash by supabase-js.
//   2. Our backend calendar connect (/api/google/oauth-callback) redirects back
//      with ?gcal=connected | denied | error.
//
// Mounted ONCE globally (App.jsx). It only ever acts on an explicit signal
// (a gcal/error param, or the bready_pending_login flag we set before a sign-in
// redirect), then strips that signal from the URL so a refresh won't re-toast.

import { useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/api/supabaseClient';

// Same flag LoginModal/RegisterModal set before redirecting to Google — lets us
// detect a sign-in that bounced back with no session and no error in the URL.
const PENDING_FLAG = 'bready_pending_login';

function readParams() {
  const out = { query: new URLSearchParams(), hash: new URLSearchParams() };
  try {
    out.query = new URL(window.location.href).searchParams;
    out.hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
  } catch {
    /* no window (SSR/tests) */
  }
  return out;
}

// Drop the consumed signal keys so a reload doesn't replay the toast.
function cleanUrl({ dropHash }) {
  try {
    const url = new URL(window.location.href);
    ['gcal', 'error', 'error_description', 'error_code'].forEach((k) => url.searchParams.delete(k));
    const hash = dropHash ? '' : window.location.hash || '';
    const next = url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '') + hash;
    window.history.replaceState({}, '', next);
  } catch {
    /* ignore */
  }
}

export default function GoogleAuthResultToaster() {
  useEffect(() => {
    const { query, hash } = readParams();
    const clearPending = () => {
      try { sessionStorage.removeItem(PENDING_FLAG); } catch { /* ignore */ }
    };

    // ── 1. Calendar connect outcome (our own server callback) ──────────────
    const gcal = query.get('gcal');
    if (gcal) {
      if (gcal === 'connected') {
        toast({ title: 'Google Calendar connected ✓', description: 'Your booked lessons will now sync to Google, and your external busy times show as warnings.' });
      } else if (gcal === 'denied') {
        toast({ variant: 'destructive', title: 'Google Calendar not connected', description: 'You declined access on the Google consent screen. Click “Google” to try again.' });
      } else {
        toast({ variant: 'destructive', title: 'Couldn’t connect Google Calendar', description: 'The connection failed on the server — usually the OAuth redirect URI or calendar scopes aren’t set up yet. Try again, or check the Google Cloud console setup.' });
      }
      clearPending();
      cleanUrl({ dropHash: false });
      return;
    }

    // ── 2. Supabase sign-in error (provider disabled / redirect not allowed) ─
    const errCode = query.get('error') || hash.get('error');
    const errDesc = query.get('error_description') || hash.get('error_description');
    if (errCode) {
      const reason = decodeURIComponent(errDesc || errCode).replace(/\+/g, ' ');
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: `${reason}. Likely the Google provider isn’t enabled for this site yet (Supabase → Auth → Providers), or this URL isn’t in the allowed Redirect URLs.`,
      });
      clearPending();
      cleanUrl({ dropHash: true });
      return;
    }

    // ── 3. Fallback: a sign-in was started but we came back with neither a
    //      session nor an incoming token nor an error → it silently failed. ──
    let pending = false;
    try { pending = sessionStorage.getItem(PENDING_FLAG) === '1'; } catch { /* ignore */ }
    if (!pending) return;

    const incomingToken = !!(hash.get('access_token') || query.get('code'));
    if (incomingToken) { clearPending(); return; } // a session is mid-parse — success path

    (async () => {
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session || null;
      } catch {
        /* ignore */
      }
      if (!session) {
        toast({
          variant: 'destructive',
          title: 'Google sign-in didn’t complete',
          description: 'You returned without a signed-in session. The Google provider is most likely not enabled for this site yet — ask the admin to enable Google in Supabase → Auth → Providers and add this URL to the allowed Redirect URLs.',
        });
      }
      clearPending();
    })();
  }, []);

  return null;
}
