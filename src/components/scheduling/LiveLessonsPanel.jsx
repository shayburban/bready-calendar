// Stage 6 — "Your live lessons" panel: the caller's REAL Supabase bookings (6a)
// plus the reschedule controls (6b, R16/R27). Role-agnostic — shows lessons where
// the viewer is the teacher OR the student. Mounted on the dashboards behind
// instantBookingEnabled(); returns null when there are no live lessons yet so it
// never clutters a dashboard that has none.
//
// Propose: pick a new start (the viewer's local wall-clock → absolute UTC via
// TimeKit) → create_reschedule (server validates grid/corridor/break/overlap —
// student hard, teacher warn). Respond: the counterparty accepts/declines a
// PENDING proposal → respond_reschedule (410 if it already expired). Both RPCs
// are live (0009/0010); lessons come from get_my_bookings (0013).

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CalendarClock, Check, X } from 'lucide-react';
import { User } from '@/api/entities';
import { detectViewerTz, wallClockToUtcISO } from '@/lib/scheduling/timekit';
import { fetchMyBookings, createReschedule, respondReschedule } from '@/lib/scheduling/bookingApi';

const fmt = (utc) => {
  try {
    return new Date(utc).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return utc;
  }
};

// The propose-a-new-time dialog. Native date/time inputs (15-min step) keep it
// dependency-free; the server re-validates the grid + corridor + break.
function RescheduleProposalDialog({ lesson, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => { setDate(''); setTime(''); setErr(null); setBusy(false); }, [lesson?.id]);

  const submit = async () => {
    if (!date || !time) { setErr('Pick a date and time.'); return; }
    let proposedStartUtc;
    try { proposedStartUtc = wallClockToUtcISO(date, time, detectViewerTz() || 'UTC'); }
    catch { setErr('That date/time is invalid.'); return; }
    setBusy(true); setErr(null);
    const r = await createReschedule({ bookingId: lesson.id, proposedStartUtc, proposedBy: lesson.viewer_role });
    setBusy(false);
    if (r.ok) onDone(); else setErr(r.message || 'Could not propose that time.');
  };

  return (
    <Dialog open={!!lesson} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Propose a new time</DialogTitle>
          <DialogDescription>{lesson?.subject || 'Lesson'} — currently {lesson ? fmt(lesson.start_time) : ''}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block text-sm">New date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
          </label>
          <label className="block text-sm">New start time (your local time)
            <input type="time" step="900" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1 w-full border rounded-md px-3 py-2" />
          </label>
          <p className="text-xs text-muted-foreground">
            Times snap to 15-minute steps.{' '}
            {lesson?.viewer_role === 'student' ? 'Must be within the teacher’s booking window and notice period.' : 'The student will be asked to confirm.'}
          </p>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <Button className="w-full btn-pill-green" disabled={busy} onClick={submit}>
            {busy ? 'Proposing…' : 'Propose reschedule'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LiveLessonsPanel() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [proposeFor, setProposeFor] = useState(null);
  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const u = await User.me(); if (alive) setUserId(u?.id || null); }
      catch { if (alive) setUserId(null); }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!userId) { setLessons([]); setLoading(false); return undefined; }
    let alive = true;
    (async () => {
      setLoading(true);
      const r = await fetchMyBookings(); // caller derived from auth.uid() (0016)
      if (!alive) return;
      setLessons(r.ok ? (r.data || []) : []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [userId, reloadKey]);

  const respond = async (lesson, action) => {
    setBusyId(lesson.id); setError(null);
    const r = await respondReschedule(lesson.reschedule_id, action);
    setBusyId(null);
    if (r.ok) refetch(); else setError(r.message || 'Could not respond to the reschedule.');
  };

  // Stay invisible until there is something real to show.
  if (!loading && lessons.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Your live lessons</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {lessons.map((b) => {
              const pendingFromOther = b.reschedule_id && b.proposed_by && b.proposed_by !== b.viewer_role;
              const pendingFromMe = b.reschedule_id && b.proposed_by === b.viewer_role;
              return (
                <div key={b.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{b.subject || 'Lesson'}</p>
                      <p className="text-sm text-muted-foreground">{fmt(b.start_time)} · {b.viewer_role === 'teacher' ? 'Teaching' : 'Learning'}</p>
                    </div>
                    <Badge variant="outline">{b.status}</Badge>
                  </div>

                  {pendingFromOther ? (
                    <div className="mt-3 rounded-md bg-amber-50 border border-amber-200 p-3">
                      <p className="text-sm">Reschedule proposed to <span className="font-medium">{fmt(b.proposed_start_utc)}</span>.</p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" disabled={busyId === b.id} onClick={() => respond(b, 'decline')}>
                          <X className="h-4 w-4 mr-1" /> Decline
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={busyId === b.id} onClick={() => respond(b, 'accept')}>
                          <Check className="h-4 w-4 mr-1" /> Accept
                        </Button>
                      </div>
                    </div>
                  ) : pendingFromMe ? (
                    <p className="mt-3 text-sm text-amber-700">You proposed {fmt(b.proposed_start_utc)} — awaiting the other party’s response.</p>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setError(null); setProposeFor(b); }}>
                      Reschedule
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <RescheduleProposalDialog
        lesson={proposeFor}
        onClose={() => setProposeFor(null)}
        onDone={() => { setProposeFor(null); refetch(); }}
      />
    </Card>
  );
}
