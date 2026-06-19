import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Loader2, Copy, Check, X, Search } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
// Same Start-Date field + Start/End-Time fields the "My Availability (T)" popup
// card uses, so the date/time pickers are identical across surfaces.
import DateRangePicker from '../common/DateRangePicker';
import TimeRangeFields from '../common/TimeRangeFields';
import { detectViewerTz, wallClockToUtcISO } from '@/lib/scheduling/timekit';
import { expandRepeatDates } from '@/lib/calendar/repeatDates';
import { syncedOverlapsForSlots } from '@/lib/calendarSyncedOverlap';
import {
  searchStudents,
  requestBooking,
  requestBookingForStudent,
  createGuestBookingInvite,
} from '@/lib/scheduling/bookingApi';
import { searchTeachers } from '@/api/teacherSearchApi';
import { createPageUrl } from '@/utils';

// Light-grey field surface so every input matches the calendar page background
// (per spec: "the fields in the popup card to be the same grey of the
// background page of the calendar").
const GREY_FIELD = 'bg-gray-50 border-gray-300';
const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toMinutes = (t) => {
  if (!t || typeof t !== 'string') return null;
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmtDate = (ymd) => {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Debounce a value (for live search-as-you-type).
function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// ── Shared Repeat control (weekday toggles + "Repeat For: N Weeks") ──────────
// When `open`, the selection repeats on the active weekdays for N weeks; when
// closed it's a single date. `summary` is rendered live from the parent.
function RepeatControl({ open, setOpen, weekdays, toggleWeekday, weeks, setWeeks, summary }) {
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-gray-900"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : '-rotate-90'}`} />
          Repeat
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 bg-gray-50 rounded-md p-3 text-sm text-gray-700 space-y-3">
        <div className="flex gap-2">
          {WEEKDAY_LETTERS.map((letter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleWeekday(i)}
              className={`h-8 w-8 rounded-full text-sm font-semibold border ${
                weekdays.includes(i)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-gray-700">Repeat For:</span>
          <Input
            type="number"
            min={1}
            max={104}
            value={weeks}
            onChange={(e) => setWeeks(e.target.value)}
            className={`w-20 ${GREY_FIELD}`}
          />
          <span>Weeks</span>
        </div>
        {summary}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Open Availability (T) — same rules as the sidebar's Set Availability ──────
function OpenAvailabilityPane({ onClose, selectedDate, onSaveAvailability, syncedEvents }) {
  const [date, setDate] = useState(selectedDate ? new Date(selectedDate) : null);
  const [time, setTime] = useState({ startTime: '', endTime: '' });
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [weekdays, setWeekdays] = useState(() =>
    selectedDate ? [new Date(selectedDate).getDay()] : []
  );
  const [weeks, setWeeks] = useState(14); // platform default availability window
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleWeekday = (i) =>
    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));

  const dates = useMemo(
    () =>
      expandRepeatDates({
        startDate: date,
        weekdays: repeatOpen ? weekdays : [],
        repeatWeeks: repeatOpen ? weeks : 0,
      }),
    [date, repeatOpen, weekdays, weeks]
  );

  const durMin = (toMinutes(time.endTime) ?? 0) - (toMinutes(time.startTime) ?? 0);
  const timeValid = !!time.startTime && !!time.endTime && durMin > 0;
  const formValid = !!date && timeValid;

  // Slots in the SAME shape the sidebar emits → reuses the exact downstream
  // path (merge, localStorage, debounced instant-booking publish).
  const slots = useMemo(
    () => (formValid ? dates.map((d) => ({ date: d, startTime: time.startTime, endTime: time.endTime })) : []),
    [formValid, dates, time]
  );

  // Same synced-overlap warning the sidebar shows (non-blocking).
  const overlaps = useMemo(
    () => (slots.length ? syncedOverlapsForSlots(slots, syncedEvents || []) : []),
    [slots, syncedEvents]
  );

  const handleSave = () => {
    if (!formValid) { setShowErrors(true); return; }
    if (saving) return;
    setSaving(true);
    try {
      onSaveAvailability?.(slots, 'open');
      toast({
        title: 'Availability schedule successfully saved.',
        description: overlaps.length
          ? '⚠ Note: This availability overlaps with a synced calendar event.'
          : `${slots.length} slot${slots.length > 1 ? 's' : ''} opened for booking.`,
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const totalHours = round2(dates.length * (durMin > 0 ? durMin / 60 : 0));

  return (
    <div className="space-y-4">
      <DateRangePicker
        singleDate
        singleValue={date}
        onSingleChange={setDate}
        singleLabel="Date"
        singlePlaceholder="Select date"
        invalid={showErrors && !date}
      />
      <div className="grid grid-cols-2 gap-2">
        <TimeRangeFields
          startTime={time.startTime}
          endTime={time.endTime}
          onChange={setTime}
          startInvalid={showErrors && !time.startTime}
          endInvalid={(!!time.startTime && !!time.endTime && durMin <= 0) || (showErrors && !time.endTime)}
          triggerClassName="h-10 px-3"
          placeholder="Select time"
        />
      </div>

      <RepeatControl
        open={repeatOpen}
        setOpen={setRepeatOpen}
        weekdays={weekdays}
        toggleWeekday={toggleWeekday}
        weeks={weeks}
        setWeeks={setWeeks}
        summary={
          <div className="space-y-1">
            <p><span className="font-semibold text-gray-700">First Date:</span> {fmtDate(dates[0])}</p>
            <p><span className="font-semibold text-gray-700">Last Date:</span> {fmtDate(dates[dates.length - 1])}</p>
            <p><span className="font-semibold text-gray-700">No. of Days:</span> {dates.length}</p>
            <p><span className="font-semibold text-gray-700">No. of Hours:</span> {totalHours}</p>
          </div>
        }
      />

      {overlaps.length > 0 && (
        <Alert className="bg-yellow-50 border border-yellow-200 text-yellow-900 text-sm">
          <AlertDescription>
            <strong>Warning:</strong> This selection overlaps with a synced calendar event
            {overlaps[0]?.range ? ` (${overlaps[0].range})` : ''}. You can still save it.
          </AlertDescription>
        </Alert>
      )}

      {formValid && (
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-semibold text-gray-800">Changes will be made to the following dates &amp; hours:</p>
          <p>{dates.length === 1 ? fmtDate(dates[0]) : `${fmtDate(dates[0])} – ${fmtDate(dates[dates.length - 1])} (${dates.length} days)`}</p>
          <p>{time.startTime} – {time.endTime}</p>
        </div>
      )}

      {showErrors && !formValid && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          Please pick a date and a valid start/end time before saving.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          aria-disabled={!formValid || saving}
          className={formValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 hover:bg-gray-300'}
        >
          {saving ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving…</span> : 'Open Availability'}
        </Button>
      </div>
    </div>
  );
}

// ── Recipient search (students or teachers) ──────────────────────────────────
function RecipientSearch({ kind, selected, onSelect }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 300);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const q = debounced.trim();
    if (selected || q.length < 2) { setResults([]); return; }
    setLoading(true);
    (async () => {
      let list = [];
      if (kind === 'student') {
        const r = await searchStudents(q, 8);
        list = (r.ok ? r.data : []).map((s) => ({ id: s.id, name: s.full_name || s.email, sub: s.email }));
      } else {
        const cards = await searchTeachers({ query: q, limit: 8 });
        list = cards.map((c) => ({ id: c.user_id, name: c.name, sub: c.subjects?.slice(0, 2).join(', '), rate: c.hourlyRate?.regular }));
      }
      if (!cancelled) { setResults(list); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [debounced, kind, selected]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 p-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
            {(selected.name || '?').charAt(0).toUpperCase()}
          </span>
          <div className="text-sm">
            <p className="font-medium text-gray-800">{selected.name}</p>
            {selected.sub && <p className="text-xs text-gray-500">{selected.sub}</p>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelect(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Label className="text-sm">{kind === 'student' ? 'Search Student By Name / Email' : 'Search Teacher By Name'}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === 'student' ? 'Enter at least 2 characters' : 'Enter teacher name'}
          className={`pl-9 ${GREY_FIELD}`}
        />
      </div>
      {loading && <p className="text-xs text-gray-500">Searching…</p>}
      {!loading && debounced.trim().length >= 2 && results.length === 0 && (
        <p className="text-xs text-gray-500">No matches found.</p>
      )}
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span>
                <span className="font-medium text-gray-800">{r.name}</span>
                {r.sub && <span className="ml-1 text-xs text-gray-500">{r.sub}</span>}
              </span>
              {r.rate != null && <span className="text-xs text-gray-500">{r.rate}$/hr</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── New Booking ──────────────────────────────────────────────────────────────
function NewBookingPane({ onClose, selectedDate, onBookingCreated }) {
  // mode: how the booking is made.
  //   known   → As a Teacher (T): request a registered student (student approves)
  //   guest   → As a Teacher (T): invite a brand-new guest via shareable link
  //   student → As a Student (S): request another teacher (teacher approves)
  const [mode, setMode] = useState('known');
  const [selected, setSelected] = useState(null); // student or teacher
  const [guest, setGuest] = useState({ name: '', email: '', phone: '' });
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState(selectedDate ? new Date(selectedDate) : null);
  const [time, setTime] = useState({ startTime: '', endTime: '' });
  const [pricePerHour, setPricePerHour] = useState('');
  const [repeatOpen, setRepeatOpen] = useState(false);
  const [weekdays, setWeekdays] = useState(() => (selectedDate ? [new Date(selectedDate).getDay()] : []));
  const [weeks, setWeeks] = useState(12);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [guestLink, setGuestLink] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset the recipient when switching modes (student vs teacher search differ).
  const onModeChange = (m) => { setMode(m); setSelected(null); setGuestLink(null); };
  const toggleWeekday = (i) =>
    setWeekdays((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));

  // When a teacher is picked for an (S) booking, prefill their hourly rate.
  const handleSelect = (r) => {
    setSelected(r);
    if (mode === 'student' && r?.rate != null) setPricePerHour(String(r.rate));
  };

  const dates = useMemo(
    () =>
      expandRepeatDates({
        startDate: date,
        weekdays: repeatOpen ? weekdays : [],
        repeatWeeks: repeatOpen ? weeks : 0,
      }),
    [date, repeatOpen, weekdays, weeks]
  );

  const durMin = (toMinutes(time.endTime) ?? 0) - (toMinutes(time.startTime) ?? 0);
  const durHrs = durMin > 0 ? durMin / 60 : 0;
  const timeValid = !!time.startTime && !!time.endTime && durMin > 0;
  const recipientValid = mode === 'guest' ? true : !!selected;
  const formValid = recipientValid && !!date && timeValid;

  const amountPer = round2((Number(pricePerHour) || 0) * durHrs);
  const meetings = mode === 'guest' ? 1 : dates.length; // a guest invite is one booking
  const totalCost = round2(amountPer * meetings);

  const submitLabel =
    mode === 'known' ? 'Send Request To Student'
    : mode === 'guest' ? 'Create Invite Link'
    : 'Send Request To Teacher';

  const handleSubmit = async () => {
    if (!formValid) { setShowErrors(true); return; }
    if (submitting) return;
    setSubmitting(true);
    setGuestLink(null);
    const tz = detectViewerTz() || 'UTC';
    try {
      if (mode === 'guest') {
        // One shareable invite for the (first) selected slot.
        const ymd = dates[0];
        let slotStartUtc;
        try { slotStartUtc = wallClockToUtcISO(ymd, time.startTime, tz); } catch { slotStartUtc = null; }
        if (!slotStartUtc) { toast({ title: 'Could not build the booking time.', variant: 'destructive' }); return; }
        const r = await createGuestBookingInvite({
          guestName: guest.name, guestEmail: guest.email,
          slotStartUtc, durationMinutes: durMin, subject: subject || 'Lesson', amount: amountPer,
        });
        if (!r.ok) { toast({ title: 'Could not create the invite.', description: r.message || r.code, variant: 'destructive' }); return; }
        const token = r.data?.token;
        const link = `${window.location.origin}${createPageUrl('GuestBooking')}?token=${token}`;
        setGuestLink(link);
        toast({ title: 'Invite link created.', description: 'Copy it and send it to your guest.' });
        return;
      }

      // known / student → one request per occurrence date.
      let ok = 0; let firstErr = null;
      for (const ymd of dates) {
        let slotStartUtc;
        try { slotStartUtc = wallClockToUtcISO(ymd, time.startTime, tz); } catch { continue; }
        const r = mode === 'known'
          ? await requestBookingForStudent({ studentId: selected.id, slotStartUtc, durationMinutes: durMin, subject: subject || 'Lesson', amount: amountPer })
          : await requestBooking({ teacherId: selected.id, slotStartUtc, durationMinutes: durMin, subject: subject || 'Lesson', amount: amountPer });
        if (r.ok) ok += 1; else if (!firstErr) firstErr = r.message || r.code;
      }
      if (ok > 0) {
        toast({
          title: mode === 'known' ? 'Request sent to the student.' : 'Request sent to the teacher.',
          description: `${ok} booking request${ok > 1 ? 's' : ''} created${firstErr ? ` (${dates.length - ok} skipped)` : ''}.`,
        });
        onBookingCreated?.();
        onClose?.();
      } else {
        toast({ title: 'Could not create the request.', description: firstErr || 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(guestLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm mb-1 block">Booking Type</Label>
        <Select value={mode} onValueChange={onModeChange}>
          <SelectTrigger className={GREY_FIELD}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="known">As a Teacher → Known Student (T)</SelectItem>
            <SelectItem value="guest">As a Teacher → New Guest (T)</SelectItem>
            <SelectItem value="student">As a Student → Book a Teacher (S)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === 'guest' ? (
        <div className="space-y-2">
          <div>
            <Label className="text-sm mb-1 block">Guest Name</Label>
            <Input value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} placeholder="Enter guest name" className={GREY_FIELD} />
          </div>
          <div>
            <Label className="text-sm mb-1 block">Guest Email (optional)</Label>
            <Input type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} placeholder="Enter guest email" className={GREY_FIELD} />
          </div>
        </div>
      ) : (
        <RecipientSearch kind={mode === 'student' ? 'teacher' : 'student'} selected={selected} onSelect={handleSelect} />
      )}

      <div>
        <Label className="text-sm mb-1 block">Subject / Service</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Mathematics" className={GREY_FIELD} />
      </div>

      <DateRangePicker
        singleDate
        singleValue={date}
        onSingleChange={setDate}
        singleLabel="Date"
        singlePlaceholder="Select date"
        invalid={showErrors && !date}
      />

      <div className="grid grid-cols-2 gap-2">
        <TimeRangeFields
          startTime={time.startTime}
          endTime={time.endTime}
          onChange={setTime}
          startInvalid={showErrors && !time.startTime}
          endInvalid={(!!time.startTime && !!time.endTime && durMin <= 0) || (showErrors && !time.endTime)}
          triggerClassName="h-10 px-3"
          placeholder="Select time"
        />
      </div>

      <div>
        <Label className="text-sm mb-1 block">Price Per Hour ($)</Label>
        <Input type="number" min={0} value={pricePerHour} onChange={(e) => setPricePerHour(e.target.value)} placeholder="0" className={`w-32 ${GREY_FIELD}`} />
      </div>

      {mode !== 'guest' && (
        <RepeatControl
          open={repeatOpen}
          setOpen={setRepeatOpen}
          weekdays={weekdays}
          toggleWeekday={toggleWeekday}
          weeks={weeks}
          setWeeks={setWeeks}
          summary={
            <div className="space-y-1">
              <p><span className="font-semibold text-gray-700">First Date:</span> {fmtDate(dates[0])}</p>
              <p><span className="font-semibold text-gray-700">Last Date:</span> {fmtDate(dates[dates.length - 1])}</p>
              <p><span className="font-semibold text-gray-700">No. Of Meetings:</span> {dates.length}</p>
              <p><span className="font-semibold text-gray-700">No. of Hours:</span> {round2(dates.length * durHrs)}</p>
              <p><span className="font-semibold text-gray-700">Total Sequence Cost:</span> {amountPer}$ × {dates.length} = {round2(amountPer * dates.length)}$</p>
            </div>
          }
        />
      )}

      {/* Cost summary (live) */}
      <div className="border-t border-b py-3 text-sm space-y-1">
        <div className="flex justify-between"><span className="font-semibold text-gray-700">Meetings:</span><span>{meetings}</span></div>
        <div className="flex justify-between"><span className="font-semibold text-gray-700">Hours:</span><span>{round2((mode === 'guest' ? 1 : dates.length) * durHrs)}</span></div>
        <div className="flex justify-between"><span className="font-semibold text-gray-700">Total Cost:</span><span className="font-semibold text-blue-600">{totalCost}$</span></div>
      </div>

      {showErrors && !formValid && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {(!recipientValid && (mode === 'student' ? 'Pick a teacher, ' : 'Pick a student, ')) || ''}
          Please pick a date and a valid start/end time before sending.
        </div>
      )}

      {guestLink && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 space-y-2">
          <p className="text-sm font-semibold text-green-800">Invite link ready — send it to your guest:</p>
          <div className="flex items-center gap-2">
            <Input readOnly value={guestLink} className="bg-white text-xs" />
            <Button size="icon" variant="outline" className="h-9 w-9 flex-shrink-0" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-600">When they register and open this link they'll see this request and can accept it.</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onClose}>{guestLink ? 'Done' : 'Cancel'}</Button>
        {!guestLink && (
          <Button
            onClick={handleSubmit}
            aria-disabled={!formValid || submitting}
            className={formValid ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-gray-500 hover:bg-gray-300'}
          >
            {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Sending…</span> : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AddNewBookingOrAvailabilityModal({
  isOpen,
  onClose,
  selectedDate,
  onSaveAvailability,
  onBookingCreated,
  syncedEvents = [],
}) {
  // Remount the panes whenever the modal (re)opens on a date, so all fields
  // reset and re-seed from `selectedDate` cleanly.
  const seedKey = `${isOpen ? 'open' : 'closed'}-${selectedDate || ''}`;
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add New Booking Or Availability</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="avail" className="w-full" key={seedKey}>
          <TabsList className="bg-transparent p-0 h-auto gap-2 mb-3">
            <TabsTrigger
              value="avail"
              className="rounded-full px-4 py-1 border border-green-600 text-green-600 data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              Open New Availability (T)
            </TabsTrigger>
            <TabsTrigger
              value="book"
              className="rounded-full px-4 py-1 border border-orange-500 text-orange-500 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              New Booking
            </TabsTrigger>
          </TabsList>
          <TabsContent value="avail">
            <OpenAvailabilityPane
              onClose={onClose}
              selectedDate={selectedDate}
              onSaveAvailability={onSaveAvailability}
              syncedEvents={syncedEvents}
            />
          </TabsContent>
          <TabsContent value="book">
            <NewBookingPane onClose={onClose} selectedDate={selectedDate} onBookingCreated={onBookingCreated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
