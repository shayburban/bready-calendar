// Stage 5b / 7 — public instant-booking surface (R2/R18/§5b). Slots come from
// bookable_slots as absolute UTC instants; we display them in the STUDENT's own
// detected time zone ONLY. The teacher's zone is intentionally hidden from the
// student: the absolute-UTC-instant law (R24) already guarantees the time shown
// is the same moment as the teacher's actual availability, so the conversion is
// the "do the times match" logic — no second zone is needed on screen.
// Mounted by BookingCalendar only when instantBookingEnabled().

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchBookableSlots } from '@/lib/scheduling/bookingApi';
import { detectViewerTz, toViewer, assertGridRegularity } from '@/lib/scheduling/timekit';
import { User } from '@/api/entities';
import CheckoutModal from '@/components/scheduling/CheckoutModal';

const DAYS_AHEAD = 14;

// Display-only formatting in the student's zone (R24 — never feeds a comparison).
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

  // The student's own zone — the ONLY zone shown (teacher's zone stays hidden).
  const viewerTz = detectViewerTz() || 'UTC';
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
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

  // R24 runtime invariant (§10.1) — fail-loud, no-op on the happy path. Asserts
  // the quarter-hour grid stays regular in the viewer's zone (the UTC offset and
  // every rendered slot minute are multiples of 15). Wrapped so a violation
  // alerts via the console but can NEVER crash the public picker.
  useEffect(() => {
    if (!slots.length) return;
    try {
      const minutes = slots.map((s) => toViewer(Date.parse(s.start_utc), viewerTz).minute);
      assertGridRegularity(viewerTz, minutes);
    } catch (e) {
      console.error('[scheduling] grid-regularity invariant violated (R24):', e?.message || e);
    }
  }, [slots, viewerTz]);

  // Group by day in the student's zone (a slot lands on the student's local day).
  const dayGroups = useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      const key = fmtDay(s.start_utc, viewerTz);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(s);
    }
    return [...m.entries()];
  }, [slots, viewerTz]);

  const onPick = (s) => setSelectedSlot({ teacherId, startUtc: s.start_utc, durationMinutes: duration, amount, subject });
  const closeModal = () => { setSelectedSlot(null); setReloadKey((k) => k + 1); };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-1">
        <CalendarIcon className="h-5 w-5 text-brand-blue" />
        <h3 className="font-bold">{subject} · {duration} min{amount ? ` · $${amount}` : ''}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-1">Pick a start time — you’ll confirm and pay to book instantly.</p>
      {teacherId ? <p className="text-xs text-muted-foreground mb-4">All times are shown in your time zone ({viewerTz}).</p> : null}

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
                  <Button key={s.start_utc} variant="outline" size="sm" data-testid="booking-slot" onClick={() => onPick(s)}>
                    {fmtTime(s.start_utc, viewerTz)}
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
        viewerTz={viewerTz}
        onClose={closeModal}
      />
    </div>
  );
}
