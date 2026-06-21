# Teacher Calendar — Popup Card Gallery (`/PopupCardsDemo`)

> ⚠️ **FAKE DATA.** Everything on the `/PopupCardsDemo` page is hard-coded fake demo
> data. There are **no real students, teachers, bookings, prices or dates** behind it.
> The page never reads or writes the database — it is purely a visual catalogue of the
> teacher-calendar popup "detail cards" so they can be reviewed in one place.

## Where to see it

Live: **https://bready-calendar.vercel.app/PopupCardsDemo**

The page renders the exact same card components the real calendar opens (the ones
`src/components/calendar/AvailabilityModal.jsx` routes to by `event.type` / `event.role`
/ `event.reschedule`). Each card is shown with a rich fake event so the layout is
realistic, but the names all carry a literal `(FAKE)` suffix and each card has a red
`FAKE` watermark.

## How to read the badges

| Badge | Meaning |
|-------|---------|
| 🟢 **LIVE** | The card reads the event/booking data it is handed. In production it will display real data. |
| 🟡 **STATIC** | The card shows built-in placeholder text (e.g. “Student N.”, “19.07.2021”, “30$”) and **ignores** the event data. Not wired to real bookings yet — the fake values on the demo page do **not** change what it shows. |

If a card ever throws while rendering with the fake data, the gallery shows a red
“⚠️ This card threw an error” box in its place instead of blanking the page.

## Current wiring audit

Verified by inspecting each component (which `event.*` fields it actually reads).

### 🟢 Wired to live event data
| Card | Opens on | File |
|------|----------|------|
| My Availability (T) | `availability` · `T` | `TeacherAvailabilityCard.jsx` |
| Availability (S) | `availability` · `S` | `TeacherAvailabilityStudentCard.jsx` |
| Waiting For Confirmation (T) | `waiting` · `T` | `WaitingForConfirmationTeacherCard.jsx` |
| Waiting For Confirmation (T) — Reschedule | `waiting` · `T` · `reschedule` | `WaitingForConfirmationTeacherRescheduleCard.jsx` |
| Waiting For Confirmation (S) — Reschedule | `waiting` · `S` · `reschedule` | `WaitingForConfirmationStudentRescheduleCard.jsx` |

> The two reschedule cards show a real **Existing Booking** vs **Proposed Booking**
> via the `src/lib/calendar/rescheduleBlocks.js` helper (they fall back to placeholder
> copy only when no reschedule payload is present).

### 🟡 Static mockups (show placeholder text, ignore event data)
| Card | Opens on | File |
|------|----------|------|
| Booked (T) | `booked` · `T` | `GlobalBookingCard.jsx` |
| Booked (T) — Reschedule | `booked` · `T` · `reschedule` | `BookedAsTeacherRescheduleCard.jsx` |
| Booked (S) | `booked` · `S` | `BookedAsStudentCard.jsx` |
| Booked (S) — Reschedule | `booked` · `S` · `reschedule` | `BookedAsStudentRescheduleCard.jsx` |
| Waiting For Confirmation (S) | `waiting` · `S` | `WaitingForConfirmationStudentCard.jsx` |
| Completed (T) | `completed` · `T` | `CompletedTeacherCard.jsx` |
| Completed (S) | `completed` · `S` | `CompletedStudentCard.jsx` |
| Not Reviewed (T) | `not-reviewed` · `T` | `NotReviewedTeacherCard.jsx` |
| Not Reviewed (S) | `not-reviewed` · `S` | `NotReviewedStudentCard.jsx` |
| Cancellation Fees (T) | `cancelled` · `T` | `CancellationFeesTeacherCard.jsx` |
| Cancellation Fees (S) | `cancelled` · `S` | `CancellationFeesCard.jsx` |
| Synced Calendar Events (modal) | `synced` | `SyncedEventsModal.jsx` |

These render correctly but always show their built-in sample text. Wiring them to real
booking data is the natural follow-up (the same pattern already used by the 🟢 cards).

## Implementation

- Page: `src/pages/PopupCardsDemo.jsx`
- Route: `/PopupCardsDemo` (registered in `src/pages/index.jsx`)
- No backend calls; all handlers are no-ops; all data is local fake fixtures.

**This page is a developer/review aid. It is safe to leave in place, and safe to delete
at any time (just remove the page file and its route).**
