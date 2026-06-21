// ╔══════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  FAKE-DATA GALLERY — NOT REAL BOOKINGS  ⚠️                          ║
// ╠══════════════════════════════════════════════════════════════════════╣
// ║  This page renders EVERY teacher-calendar popup "detail card" in one    ║
// ║  place so the cards can be reviewed at a glance. Every value shown here ║
// ║  is HARD-CODED FAKE demo data — there are no real students, teachers,   ║
// ║  bookings, prices or dates behind it. Nothing on this page reads or     ║
// ║  writes the database. It exists purely as a visual catalogue.           ║
// ║                                                                          ║
// ║  Each card is labelled with:                                            ║
// ║    • its human title                                                    ║
// ║    • the routing condition that opens it (type / role / reschedule)     ║
// ║    • the component file it lives in                                     ║
// ║    • a wiring badge:                                                     ║
// ║         🟢 LIVE   = the card reads the event data it is given           ║
// ║         🟡 STATIC = the card shows built-in placeholder text and        ║
// ║                     IGNORES the event data (not wired to real           ║
// ║                     bookings yet — so the fake values below do NOT      ║
// ║                     change what it displays).                           ║
// ║                                                                          ║
// ║  See docs/popup-cards-demo.md for the full written audit.               ║
// ╚══════════════════════════════════════════════════════════════════════╝

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

// All teacher-calendar detail cards (the same components AvailabilityModal routes to).
import TeacherAvailabilityCard from '@/components/calendar/TeacherAvailabilityCard';
import TeacherAvailabilityStudentCard from '@/components/calendar/TeacherAvailabilityStudentCard';
import GlobalBookingCard from '@/components/calendar/GlobalBookingCard';
import BookedAsTeacherRescheduleCard from '@/components/calendar/BookedAsTeacherRescheduleCard';
import BookedAsStudentCard from '@/components/calendar/BookedAsStudentCard';
import BookedAsStudentRescheduleCard from '@/components/calendar/BookedAsStudentRescheduleCard';
import WaitingForConfirmationTeacherCard from '@/components/calendar/WaitingForConfirmationTeacherCard';
import WaitingForConfirmationTeacherRescheduleCard from '@/components/calendar/WaitingForConfirmationTeacherRescheduleCard';
import WaitingForConfirmationStudentCard from '@/components/calendar/WaitingForConfirmationStudentCard';
import WaitingForConfirmationStudentRescheduleCard from '@/components/calendar/WaitingForConfirmationStudentRescheduleCard';
import CompletedTeacherCard from '@/components/calendar/CompletedTeacherCard';
import CompletedStudentCard from '@/components/calendar/CompletedStudentCard';
import NotReviewedTeacherCard from '@/components/calendar/NotReviewedTeacherCard';
import NotReviewedStudentCard from '@/components/calendar/NotReviewedStudentCard';
import CancellationFeesTeacherCard from '@/components/calendar/CancellationFeesTeacherCard';
import CancellationFeesCard from '@/components/calendar/CancellationFeesCard';
import SyncedEventsModal from '@/components/calendar/SyncedEventsModal';

// ── Fake data (clearly fake on purpose) ─────────────────────────────────────
const noop = () => {};

const FAKE_DATES = [
  '2026-04-12', '2026-04-14', '2026-04-16', '2026-04-19',
  '2026-04-20', '2026-04-25', '2026-04-27',
];

const FAKE_SAVED_SLOTS = [
  { date: '2026-04-25', startTime: '15:00', endTime: '16:00' },
  { date: '2026-04-25', startTime: '17:00', endTime: '19:00' },
];

// A reasonably complete fake event. `(FAKE)` is baked into the names so it is
// obvious on screen that none of this is real.
const ev = (over = {}) => ({
  id: 'FAKE',
  date: 25,
  dateString: '2026-04-25',
  time: '15:00 - 16:00',
  availableDatesForCategory: FAKE_DATES,
  student: 'Alex Student (FAKE)',
  teacher: 'Dana Teacher (FAKE)',
  student_name: 'Alex Student (FAKE)',
  tutor_name: 'Dana Teacher (FAKE)',
  amount: 30,
  hourly_rate: 10,
  duration_hours: 3,
  subject: 'Algebra · FAKE',
  timeSlots: ['15:00 - 16:00', '17:00 - 19:00'],
  description: 'FAKE demo event — not a real booking',
  ...over,
});

// Existing-vs-proposed pair for the reschedule cards (distinct so the two
// blocks are visibly different).
const RESCHED = {
  existing: { time: '13:00 - 14:00', dateLabel: '19.04.2026', amount: 30, hourly_rate: 10, duration_hours: 3 },
  proposed: { time: '16:00 - 17:00', dateLabel: '25.04.2026', amount: 30, hourly_rate: 10, duration_hours: 3 },
};

// ── Per-card error boundary ─────────────────────────────────────────────────
// If a card throws with the fake data, show a visible red box instead of
// white-screening the whole gallery — that itself is useful review signal.
class CardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="border-2 border-red-400 bg-red-50 rounded-lg p-4 text-sm text-red-700 w-full max-w-sm mx-auto">
          <p className="font-bold">⚠️ This card threw an error when rendered with the fake data.</p>
          <code className="text-xs break-all block mt-2">
            {String(this.state.error?.message || this.state.error)}
          </code>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Card catalogue ──────────────────────────────────────────────────────────
// wired: 'live'   -> 🟢 reads the event data it is given
//        'static' -> 🟡 shows built-in placeholder text, ignores event data
const SECTIONS = [
  {
    group: 'Availability',
    items: [
      {
        title: 'My Availability (T)', cond: "type: availability · role: T", file: 'TeacherAvailabilityCard.jsx', wired: 'live',
        node: (
          <TeacherAvailabilityCard
            event={ev({ type: 'availability', role: 'T', count: 2 })}
            onClose={noop} onDateChange={noop}
            savedAvailabilitySlots={FAKE_SAVED_SLOTS} onAvailabilityChanged={noop} showEditIcon={false}
          />
        ),
      },
      {
        title: 'Availability (S)', cond: "type: availability · role: S", file: 'TeacherAvailabilityStudentCard.jsx', wired: 'live',
        node: <TeacherAvailabilityStudentCard event={ev({ type: 'availability', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
  {
    group: 'Booked',
    items: [
      {
        title: 'Booked (T)', cond: "type: booked · role: T", file: 'GlobalBookingCard.jsx', wired: 'static',
        node: <GlobalBookingCard event={ev({ type: 'booked', role: 'T' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Booked (T) — Reschedule', cond: "type: booked · role: T · reschedule", file: 'BookedAsTeacherRescheduleCard.jsx', wired: 'static',
        node: <BookedAsTeacherRescheduleCard event={ev({ type: 'booked', role: 'T', reschedule: true, ...RESCHED })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Booked (S)', cond: "type: booked · role: S", file: 'BookedAsStudentCard.jsx', wired: 'static',
        node: <BookedAsStudentCard event={ev({ type: 'booked', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Booked (S) — Reschedule', cond: "type: booked · role: S · reschedule", file: 'BookedAsStudentRescheduleCard.jsx', wired: 'static',
        node: <BookedAsStudentRescheduleCard event={ev({ type: 'booked', role: 'S', reschedule: true, ...RESCHED })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
  {
    group: 'Waiting For Confirmation',
    items: [
      {
        title: 'Waiting (T)', cond: "type: waiting · role: T", file: 'WaitingForConfirmationTeacherCard.jsx', wired: 'live',
        node: <WaitingForConfirmationTeacherCard event={ev({ type: 'waiting', role: 'T' })} onClose={noop} onDateChange={noop} onResponded={noop} />,
      },
      {
        title: 'Waiting (T) — Reschedule', cond: "type: waiting · role: T · reschedule", file: 'WaitingForConfirmationTeacherRescheduleCard.jsx', wired: 'live',
        node: <WaitingForConfirmationTeacherRescheduleCard event={ev({ type: 'waiting', role: 'T', reschedule: true, ...RESCHED })} onClose={noop} onDateChange={noop} onResponded={noop} />,
      },
      {
        title: 'Waiting (S)', cond: "type: waiting · role: S", file: 'WaitingForConfirmationStudentCard.jsx', wired: 'static',
        node: <WaitingForConfirmationStudentCard event={ev({ type: 'waiting', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Waiting (S) — Reschedule', cond: "type: waiting · role: S · reschedule", file: 'WaitingForConfirmationStudentRescheduleCard.jsx', wired: 'live',
        node: <WaitingForConfirmationStudentRescheduleCard event={ev({ type: 'waiting', role: 'S', reschedule: true, ...RESCHED })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
  {
    group: 'Completed',
    items: [
      {
        title: 'Completed (T)', cond: "type: completed · role: T", file: 'CompletedTeacherCard.jsx', wired: 'static',
        node: <CompletedTeacherCard event={ev({ type: 'completed', role: 'T' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Completed (S)', cond: "type: completed · role: S", file: 'CompletedStudentCard.jsx', wired: 'static',
        node: <CompletedStudentCard event={ev({ type: 'completed', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
  {
    group: 'Not Reviewed',
    items: [
      {
        title: 'Not Reviewed (T)', cond: "type: not-reviewed · role: T", file: 'NotReviewedTeacherCard.jsx', wired: 'static',
        node: <NotReviewedTeacherCard event={ev({ type: 'not-reviewed', role: 'T' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Not Reviewed (S)', cond: "type: not-reviewed · role: S", file: 'NotReviewedStudentCard.jsx', wired: 'static',
        node: <NotReviewedStudentCard event={ev({ type: 'not-reviewed', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
  {
    group: 'Cancellation Fees',
    items: [
      {
        title: 'Cancellation Fees (T)', cond: "type: cancelled · role: T", file: 'CancellationFeesTeacherCard.jsx', wired: 'static',
        node: <CancellationFeesTeacherCard event={ev({ type: 'cancelled', role: 'T' })} onClose={noop} onDateChange={noop} />,
      },
      {
        title: 'Cancellation Fees (S)', cond: "type: cancelled · role: S", file: 'CancellationFeesCard.jsx', wired: 'static',
        node: <CancellationFeesCard event={ev({ type: 'cancelled', role: 'S' })} onClose={noop} onDateChange={noop} />,
      },
    ],
  },
];

const WiredBadge = ({ wired }) =>
  wired === 'live' ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
      🟢 LIVE · reads event data
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      🟡 STATIC · placeholder text only
    </span>
  );

function CardFrame({ item }) {
  return (
    <div className="flex flex-col w-full max-w-sm">
      <div className="mb-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-sm text-gray-800">{item.title}</h4>
          <WiredBadge wired={item.wired} />
        </div>
        <p className="text-[11px] text-gray-500 font-mono">{item.cond}</p>
        <p className="text-[11px] text-gray-400 font-mono">{item.file}</p>
      </div>
      <div className="relative">
        {/* watermark so screenshots are unambiguous */}
        <span className="absolute -top-2 left-2 z-10 text-[10px] font-bold tracking-wider text-red-500 bg-white/80 px-1 rounded">
          FAKE
        </span>
        <CardErrorBoundary>{item.node}</CardErrorBoundary>
      </div>
    </div>
  );
}

export default function PopupCardsDemo() {
  const [syncedOpen, setSyncedOpen] = useState(false);

  const liveCount = SECTIONS.flatMap((s) => s.items).filter((i) => i.wired === 'live').length;
  const totalCount = SECTIONS.flatMap((s) => s.items).length;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky FAKE banner */}
      <div className="sticky top-0 z-30 bg-red-600 text-white text-center py-2 px-4 text-sm font-bold shadow">
        ⚠️ FAKE DATA — this page is a visual catalogue of the teacher-calendar popup cards. Nothing here is a real
        booking, student, price or date.
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Teacher Calendar — Popup Card Gallery</h1>
        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          Every popup "detail card" the teacher calendar can open is shown below with <strong>hard-coded fake data</strong>.
          Use it to review each card's design and see what is built, what is only a static mockup, and what is missing.
          The same components render here as in the real calendar (routed by <code className="font-mono">AvailabilityModal</code>).
        </p>

        {/* Legend */}
        <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-lg p-3 border">
            <p className="font-semibold mb-1">Legend</p>
            <p className="flex items-center gap-2 mb-1"><WiredBadge wired="live" /></p>
            <p className="text-xs text-gray-600 mb-2">Card reads the booking/event data it is handed (will show real data in production).</p>
            <p className="flex items-center gap-2 mb-1"><WiredBadge wired="static" /></p>
            <p className="text-xs text-gray-600">Card shows built-in placeholder text and <strong>ignores</strong> the event data — not wired to real bookings yet. The fake values below do not change what it shows.</p>
          </div>
          <div className="bg-white rounded-lg p-3 border text-xs text-gray-600">
            <p className="font-semibold text-sm mb-1 text-gray-800">Status summary</p>
            <p>{liveCount} of {totalCount} inline cards are wired to read live event data (🟢).</p>
            <p className="mt-1">The remaining {totalCount - liveCount} are visual mockups (🟡) showing static text such as “Student N.”, “19.07.2021”, “30$” regardless of the real booking.</p>
            <p className="mt-2 text-gray-500">Full written audit: <code className="font-mono">docs/popup-cards-demo.md</code></p>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <section key={section.group} className="mt-8">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-4">{section.group}</h2>
            <div className="flex flex-wrap gap-6 items-start">
              {section.items.map((item) => (
                <CardFrame key={item.title} item={item} />
              ))}
            </div>
          </section>
        ))}

        {/* Synced events live in a Dialog (not an inline card), so open it on demand */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-1 mb-4">Synced Calendar Events (modal)</h2>
          <div className="bg-white rounded-lg p-4 border max-w-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-bold text-sm text-gray-800">Synced Calendar Events</h4>
              <WiredBadge wired="static" />
            </div>
            <p className="text-[11px] text-gray-500 font-mono">type: synced</p>
            <p className="text-[11px] text-gray-400 font-mono mb-3">SyncedEventsModal.jsx</p>
            <p className="text-xs text-gray-600 mb-3">
              This one is a Dialog/overlay rather than an inline card, so open it to view it:
            </p>
            <Button onClick={() => setSyncedOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              ▶ Open Synced Events Modal (FAKE)
            </Button>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 mt-10 mb-4">
          ⚠️ Reminder: every value on this page is FAKE demo data. — Bready Calendar component gallery.
        </p>
      </div>

      <SyncedEventsModal
        event={ev({
          type: 'synced',
          slotHeader: null,
          timeSlots: ['15:00 - 16:00', '17:00 - 19:00'],
          siblingEvents: [],
        })}
        events={[]}
        isOpen={syncedOpen}
        onClose={() => setSyncedOpen(false)}
      />
    </div>
  );
}
