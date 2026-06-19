import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Clock, DollarSign, User, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import {
  getGuestBookingInvite,
  claimGuestBookingInvite,
  respondBookingRequest,
} from '@/lib/scheduling/bookingApi';

// Landing page for a teacher's shareable guest-booking invite link
// (?token=…). A brand-new guest opens it, sees the proposed booking, logs in /
// registers (Google), and accepts — which materialises a real booking on their
// calendar. No email infrastructure required: the teacher sends this link
// however they like. See migration 0024 (create/get/claim_guest_booking_invite).

function getToken() {
  try { return new URLSearchParams(window.location.search).get('token'); }
  catch { return null; }
}

const fmt = (iso, opts) => {
  try { return new Date(iso).toLocaleString('en-US', opts); } catch { return iso; }
};

export default function GuestBooking() {
  const token = getToken();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // 'accepted' | 'declined'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) { setError('This invite link is missing its token.'); setLoading(false); return; }
      try {
        const { data: { session: s } } = await supabase.auth.getSession();
        if (!cancelled) setSession(s);
        const r = await getGuestBookingInvite(token);
        if (cancelled) return;
        if (!r.ok || !r.data) { setError('This invite could not be found.'); }
        else if (r.data.status === 'cancelled') { setError('This invite has been cancelled.'); }
        else { setInvite(r.data); if (r.data.status === 'claimed') setDone('accepted'); }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Could not load this invite.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const handleLogin = async () => {
    // Return straight back to this token page after Google sign-in.
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (e) setError(`Login failed: ${e.message}`);
  };

  const handleAccept = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const claim = await claimGuestBookingInvite(token);
      if (!claim.ok) { setError(claim.message || claim.code || 'Could not accept this booking.'); return; }
      // claim creates a student-approves request → confirm it now.
      const booking = claim.data;
      if (booking?.id && booking.status === 'requested') {
        await respondBookingRequest(booking.id, 'approve');
      }
      setDone('accepted');
    } catch (e) {
      setError(e?.message || 'Could not accept this booking.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-5">
        <h1 className="text-xl font-bold text-gray-800 text-center">Booking Invitation</h1>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-gray-600 py-8">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading invite…
          </div>
        )}

        {!loading && error && (
          <div className="text-center space-y-4">
            <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">{error}</p>
            <Link to={createPageUrl('Home')}><Button variant="outline">Go to Home</Button></Link>
          </div>
        )}

        {!loading && !error && invite && (
          <>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4 text-gray-500" />
                <span><span className="font-semibold">Teacher:</span> {invite.tutor_name || 'Your teacher'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">Subject:</span> {invite.subject || 'Lesson'}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4 text-gray-500" />
                {fmt(invite.start_time, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-gray-500" />
                {fmt(invite.start_time, { hour: '2-digit', minute: '2-digit' })} – {fmt(invite.end_time, { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span><span className="font-semibold">Price:</span> {Number(invite.amount || 0)}$</span>
              </div>
            </div>

            {done === 'accepted' ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle2 className="h-5 w-5" /> Booking confirmed!
                </div>
                <p className="text-sm text-gray-600">It's now on your calendar.</p>
                <Link to={createPageUrl('StudentDashboard')}><Button className="bg-green-600 hover:bg-green-700">Go to my dashboard</Button></Link>
              </div>
            ) : !session ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">Log in or register to accept this booking.</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
                  Continue with Google
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link to={createPageUrl('Home')} className="flex-1">
                  <Button variant="outline" className="w-full">Not now</Button>
                </Link>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleAccept} disabled={busy}>
                  {busy ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Accepting…</span> : 'Accept Booking'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
