// Bridge: registration step 5c "Set Your Availability" -> the teacher calendar
// backend, so availability painted during onboarding is live for the teacher as
// a teacher (T) — identical storage to the calendar, no separate code path.
//
// 5c holds a WEEKLY wall-clock pattern ({ Monday: [{start,end}], ... }); the
// teacher calendar stores DATED absolute-UTC instants in availability_one_off
// (via set_availability_one_off, migration 0012). This module materializes the
// weekly pattern into dated slots for a horizon, then runs them through the SAME
// pipeline the calendar uses — availabilityToRows (TimeKit, R24) -> the same RPC
// -> under the SAME instant-booking flag. The 5c UI/logic is untouched; this is
// purely the persistence seam that makes its backend match the calendar's.

import { supabase } from '@/api/supabaseClient';
import { availabilityToRows } from '@/lib/scheduling/availabilityToRows';
import { setAvailabilityOneOff } from '@/lib/scheduling/availabilityApi';
import { detectViewerTz } from '@/lib/scheduling/timekit';
import { instantBookingEnabled } from '@/lib/scheduling/flags';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HORIZON_WEEKS = 12; // how far ahead the weekly pattern is materialized

// Unify the two historical slot-time namings into one canonical accessor:
// the 5c scheduler writes {start,end}; validation/legacy used {startHour,endHour}.
// Reading both here is the "unify startHour/endHour at the backend" the data
// needs, without touching the 5c UI.
export const slotStart = (slot) => (slot && (slot.start != null ? slot.start : slot.startHour)) || '';
export const slotEnd = (slot) => (slot && (slot.end != null ? slot.end : slot.endHour)) || '';

// Hour-of-day (number) parsed from an "HH:MM" slot start — for morning/afternoon/
// evening tagging that historically (wrongly) assumed a numeric `startHour`.
export const slotStartHourNum = (slot) => {
  const v = String(slotStart(slot));
  const h = parseInt(v.split(':')[0], 10);
  return Number.isFinite(h) ? h : null;
};

const pad2 = (n) => String(n).padStart(2, '0');
const toYMD = (d) => `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

// Materialize { Sunday:[{start,end}], ... } into dated wall-clock slots
// [{ date:'YYYY-MM-DD', startTime:'HH:MM', endTime:'HH:MM' }] for the next
// `weeks`. Uses UTC-midnight date math (a calendar date's weekday is the same in
// every zone), so generation is tz-independent; the (date,time) pair is later
// interpreted in the teacher's tz by availabilityToRows.
export const weeklySlotsToDatedSlots = (weeklySlots, weeks = HORIZON_WEEKS) => {
  if (!weeklySlots || typeof weeklySlots !== 'object') return [];
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const out = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start.getTime() + i * 86400000);
    const daySlots = weeklySlots[DAY_NAMES[d.getUTCDay()]] || [];
    const ymd = toYMD(d);
    for (const s of daySlots) {
      const st = slotStart(s);
      const en = slotEnd(s);
      if (st && en && st < en) out.push({ date: ymd, startTime: st, endTime: en });
    }
  }
  return out;
};

// Write the 5c weekly availability into the teacher-calendar backend. Flag-gated
// exactly like the calendar's own mirror (instantBookingEnabled), best-effort,
// never throws — registration must complete even if this sync is skipped.
export const syncRegistrationAvailabilityToCalendar = async (weeklySlots, tz) => {
  try {
    if (!instantBookingEnabled()) return { ok: false, skipped: true, reason: 'flag-off' };
    const { data: { session } } = await supabase.auth.getSession();
    const teacherId = session?.user?.id;
    if (!teacherId) return { ok: false, skipped: true, reason: 'no-session' };
    const dated = weeklySlotsToDatedSlots(weeklySlots);
    const rows = availabilityToRows(dated, tz || detectViewerTz() || 'UTC');
    return await setAvailabilityOneOff(teacherId, rows);
  } catch (e) {
    console.warn('[registrationAvailability] sync skipped:', e?.message || e);
    return { ok: false, message: e?.message || 'error' };
  }
};
