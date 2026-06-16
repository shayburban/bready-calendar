// Stage 5b — public instant-booking surface (R2/R18/§5b).
//
// Renders a teacher's bookable quarter-hour start times (slots-only, R18) and
// opens the CheckoutModal on click. Mounted by BookingCalendar ONLY when
// instantBookingEnabled() is on, so flags-off keeps the legacy placeholder.
//
// Teacher context arrives via query params (?teacherId=&duration=&subject=&rate=)
// — the dashboard "Book" links carry them. Times are absolute UTC instants from
// the server; we format them in the viewer's local zone for display only (R24).

import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchBookableSlots } from '@/lib/scheduling/bookingApi';
import { User } from '@/api/entities';
import CheckoutModal from '@/components/scheduling/CheckoutModal';

const DAYS_AHEAD = 14;

const fmtTime = (utc) => {
  try { return new Date(utc).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
  catch { return utc; }
};
const fmtDay = (utc) => {
  try { return new Date(utc).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); }
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

  // Fetch the teacher's bookable slots over the visible window (R18/R22).
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

  const dayGroups = useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      const key = fmtDay(s.start_utc);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(s);
    }
    return [...m.entries()];
  }, [slots]);

  const onPick = (s) => setSelectedSlot({ teacherId, startUtc: s.start_utc, durationMinutes: duration, amount, subject });
  const closeModal = () => { setSelectedSlot(null); setReloadKey((k) => k + 1); };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-2 mb-1">
        <CalendarIcon className="h-5 w-5 text-brand-blue" />
        <h3 className="font-bold">{subject} · {duration} min{amount ? ` · $${amount}` : ''}</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Pick a start time — you’ll confirm and pay to book instantly.</p>

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
                    {fmtTime(s.start_utc)}
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
        onClose={closeModal}
      />
    </div>
  );
}
