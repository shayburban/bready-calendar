// Stage 5b / 7 — public instant-booking surface (R2/R18/§5b) with dual-zone
// display (R-display/§5): shows BOTH the viewer's detected zone and the teacher's
// zone, with a one-tap override of which zone the times render in. Slots come
// from bookable_slots as absolute UTC instants; we format for DISPLAY only
// (R24) and group by day in the chosen zone (a slot can be a different weekday
// per viewer). Mounted by BookingCalendar only when instantBookingEnabled().

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchBookableSlots, fetchTeacherTz } from '@/lib/scheduling/bookingApi';
import { detectViewerTz } from '@/lib/scheduling/timekit';
import { User } from '@/api/entities';
import CheckoutModal from '@/components/scheduling/CheckoutModal';

const DAYS_AHEAD = 14;

// Display-only formatting in an explicit IANA zone (R24 — never feeds a comparison).
const fmtTime = (utc, tz) => {
  try { return new Date(utc).toLocaleTimeString(undefined, { timeZone: tz, hour: '2-digit', minute: '2-digit' }); }
  catch { return utc; }
};
const fmtDay = (utc, tz) => {
  try { return new Date(utc).toLocaleDateString(undefined, { timeZone: tz, weekday: 'long', month: 'short', day: 'numeric' }); }
  catch { return utc; }
};

export default function InstantBookingView() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const teacherId = params.get('teacherId') || null;
  const duration = Number(params.get('duration')) || 60;
  const subject = params.get('subject') || 'Lesson';
  const rate = params.get('rate') != null ? Number(params.get('rate')) : null;
  const amount = rate != null ? Math.round((rate * duration) / 60) : 0;

  const viewerTz = detectViewerTz() || 'UTC';
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [teacherTz, setTeacherTz] = useState(null);
  const [displayTz, setDisplayTz] = useState(viewerTz);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Who's booking (for the rebind). Async; guests stay null until they register.
  useEffect(() => {
    let alive = true;
    (async () => {
      try { const u = await User.me(); if (alive) setCurrentStudentId(u?.id || null); }
      catch { if (alive) setCurrentStudentId(null); }
      finally { if (alive) setUserLoaded(true); }
    })();
    return () => { alive = false; };
  }, []);

  // Teacher's display zone for the dual-zone banner (public, via get_teacher_tz, 0014).
  useEffect(() => {
    if (!teacherId) return undefined;
    let alive = true;
    (async () => { const r = await fetchTeacherTz(teacherId); if (alive && r.ok && r.data) setTeacherTz(r.data); })();
    return () => { alive = false; };
  }, [teacherId]);

  // Bookable slots over the visible window (R18; R22 client cache in bookingApi).
  useEffect(() => {
    if (!teacherId) return undefined;
    let alive = true;
    (async () => {
      setLoading(true); setError(null);
      const fromUtc = new Date().toISOString();
      const toUtc = new Date(Date.now() + DAYS_AHEAD * 86400000).toISOString();
      const r = await fetchBookableSlots(teacherId, fromUtc, toUtc, [duration]);
      if (!alive) return;
      if (r.ok) setSlots(r.data || []);
      else { setSlots([]); setError(r.message || 'Could not load available times.'); }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [teacherId, duration, reloadKey]);

  // Group by day IN THE CHOSEN DISPLAY ZONE (a slot may be a different weekday per viewer).
  const dayGroups = useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      const key = fmtDay(s.start_utc, displayTz);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(s);
    }
    return [...m.entries()];
  }, [slots, displayTz]);

  const onPick = (s) => setSelectedSlot({ teacherId, startUtc: s.start_utc, durationMinutes: duration, amount, subject });
  const closeModal = () => { setSelectedSlot(null); setReloadKey((k) => k + 1); };
  const tabCls = (z) => `underline-offset-2 ${displayTz === z ? 'font-semibold text-foreground underline' : 'text-muted-foreground hover:underline'}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-1">
        <CalendarIcon className="h-5 w-5 text-brand-blue" />
        <h3 className="font-bold">{subject} · {duration} min{amount ? ` · $${amount}` : ''}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Pick a start time — you’ll confirm and pay to book instantly.</p>

      {teacherId ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mb-4">
          <button type="button" onClick={() => setDisplayTz(viewerTz)} className={tabCls(viewerTz)}>Your time: {viewerTz}</button>
          <span className="text-muted-foreground">·</span>
          <button type="button" disabled={!teacherTz} onClick={() => teacherTz && setDisplayTz(teacherTz)} className={`${tabCls(teacherTz)} disabled:opacity-50`}>
            Teacher’s time: {teacherTz || '—'}
          </button>
          <span className="text-muted-foreground">(tap to switch)</span>
        </div>
      ) : null}

      {!teacherId ? (
        <p className="text-sm text-gray-500 py-8 text-center">Choose a tutor from Find Tutors to see their available times.</p>
      ) : loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : error ? (
        <p className="text-sm text-red-600 py-8 text-center">{error}</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">No open times in the next {DAYS_AHEAD} days. This tutor hasn’t opened bookable availability yet.</p>
      ) : (
        <div className="space-y-5">
          {dayGroups.map(([day, daySlots]) => (
            <div key={day}>
              <p className="text-sm font-semibold text-gray-700 mb-2">{day}</p>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => (
                  <Button key={s.start_utc} variant="outline" size="sm" onClick={() => onPick(s)}>
                    {fmtTime(s.start_utc, displayTz)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CheckoutModal
        open={!!selectedSlot}
        slot={selectedSlot}
        currentStudentId={currentStudentId}
        authReady={userLoaded}
        teacherTz={teacherTz}
        viewerTz={viewerTz}
        onClose={closeModal}
      />
    </div>
  );
}
