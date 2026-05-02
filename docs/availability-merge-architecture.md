# Availability Merge — Architecture & Backend Contract

> Status: **frontend implemented, backend pending**.
> The frontend already runs the merge algorithm before emitting slots from
> `CalendarSidebar.handleSave`. The backend MUST repeat the same merge before
> persisting because (a) the frontend may be bypassed by a different client
> and (b) two concurrent saves can produce overlap that only the database
> sees. Treat the frontend merge as a UX optimization, never a guarantee.

---

## 1. Problem

Teachers compose availability by stacking date ranges (rows in the
sidebar) and time ranges (per-slot rows). Two adjacent rows can overlap or
abut (`20 Jun – 15 Jul` + `10 Jul – 21 Oct`). Persisting the rows as-is
creates fragmented database records, ambiguous queries
(`is 12 Jul covered? two rows say yes`), and wasted storage.

The system must consolidate rows into a **canonical, non-overlapping set**
in two places:

1. **UI summary** — what the user sees in the "Review Changes" block.
2. **Persistence layer** — what is written to the `Availability` table.

Both must run the **same algorithm** with the **same inputs** so the
preview matches the saved state byte-for-byte.

---

## 2. Algorithm — Snap → Sort-and-Fold

Two stages, **order matters**:

**Stage 1 — Snap to active weekdays** (v4). For every raw row, replace
`(rawStart, rawEnd)` with `(actualStart, actualEnd)`:

- `actualStart` = first date `>= rawStart` whose weekday is in
  `activeWeekdays`
- `actualEnd`   = last  date `<= rawEnd`   whose weekday is in
  `activeWeekdays`
- Drop the row entirely if the window contains no matching weekday
- Open-ended rows (`noEndDate=true`) only snap `actualStart`

**Stage 2 — Merge** the snapped survivors via sweep / sort-and-fold:

```
function mergeIntervals(intervals):
  valid   = filter intervals where start <= end
  sorted  = sort valid by start ascending
  result  = []
  for each iv in sorted:
    last = result.last or null
    if last and iv.start <= last.end:
      last.end = max(last.end, iv.end)
    else:
      result.append(copy of iv)
  return result
```

Snap-then-merge (not merge-then-snap): each user-entered row is its own
sandbox for the snap step, so two rows separated by a gap that *would*
disappear under a raw merge stay separate when their snapped survivors
don't actually touch. The reference implementation lives in
`snapRangeToActiveWeekdays`, `mergeSnappedRanges`, and `computeFinalRanges`
in `src/components/calendar/CalendarSidebar.jsx`.

Properties:

- **O(n log n)** — bounded by the sort.
- **Stable** — order of equal-start ranges does not affect output (we always
  extend `last.end` with `max`).
- **Inclusive endpoints** — touching ranges (`[1..5]`, `[5..9]`) merge to
  `[1..9]` because the comparison is `iv.start <= last.end`. This matches
  the user spec ("starts before *or exactly when* the previous range ends").
- **Open-ended (∞) handling** — when `noEndDate` is checked client-side, the
  end is replaced with `+∞`. The fold collapses every later range into the
  earliest-start ∞ row. Persistence layer represents `∞` as
  `end_date IS NULL` (see §4).

---

## 3. Where merges run

| Layer | Location | Trigger | Output |
|---|---|---|---|
| Frontend preview | `CalendarSidebar` Review Changes block | every state change (date pick, weekday toggle, time edit, no-end-date toggle) | rendered summary |
| Frontend save | `CalendarSidebar.handleSave` | "Save Dates" button click | array of `{date, startTime, endTime}` slots emitted to parent |
| **Backend save** *(to build)* | `POST /availability/save` handler | API call | merged rows in `Availability` table + emitted domain event |

The backend must NOT trust the client-merged payload. It re-runs the merge
(a) over the incoming payload and (b) against existing rows owned by the
same teacher in the same window (see §5 — Idempotent Save).

---

## 4. Database schema (target)

The current `Availability` entity (`src/api/base44Client.js` seed) only
stores `{ teacher_id, day_of_week, start_time, end_time }` — pure weekly
recurrence with no calendar window. That schema cannot represent
"available 20 Jun – 21 Oct, Mon/Wed only, 09:00–11:15 + 14:30–18:00".

Proposed replacement schema:

```ts
// One row per merged date interval per teacher.
type AvailabilityWindow = {
  id: string;
  teacher_id: string;
  start_date: string;         // 'YYYY-MM-DD' (inclusive)
  end_date: string | null;    // 'YYYY-MM-DD' (inclusive); null = open-ended (∞)
  weekdays: number[];         // subset of [0..6] (Sun..Sat); empty array == all days
  time_slots: Array<{ start_time: string; end_time: string }>; // 'HH:MM' on 15-min grid
  mode: 'open' | 'closed';    // open = available; closed = blackout
  created_date: string;
  updated_date: string;
};
```

Invariants the backend MUST enforce:

1. **No overlapping windows** for the same `(teacher_id, mode)` pair.
2. **`time_slots` is itself merged** — no overlapping/adjacent entries.
3. **Time grid** — every `start_time` and `end_time` matches `/^([01]\d|2[0-3]):(00|15|30|45)$/`.
4. **Range validity** — `start_date <= end_date` when `end_date` is not null.
5. `weekdays` is a sorted, deduped subset of `[0..6]`; `[]` is forbidden
   (callers wanting all days send `[0,1,2,3,4,5,6]`).

---

## 5. Save endpoint contract

```
POST /availability/save
Authorization: Bearer <teacher token>

{
  "mode": "open" | "closed",
  "ranges": [
    { "start_date": "2026-06-20", "end_date": "2026-07-15" },
    { "start_date": "2026-07-10", "end_date": "2026-10-21" },
    { "start_date": "2026-11-20", "end_date": null }
  ],
  "weekdays": [1, 3],
  "time_slots": [
    { "start_time": "09:00", "end_time": "11:15" },
    { "start_time": "10:30", "end_time": "12:00" }
  ]
}
```

Server-side pipeline (in this order — order matters):

1. **Validate** — schema, time grid, weekday subset, dates parseable.
2. **Snap each range to weekdays** (§2 stage 1) — for every incoming
   range, advance `start_date` to the first date matching an entry in
   `weekdays`, and retreat `end_date` to the last. Drop ranges with no
   matching weekday. **Reject the request** if all incoming ranges drop
   out (this matches the frontend's "Save Dates" disabled state and
   prevents a silent no-op write).
3. **Merge ranges** (§2 stage 2) — fold the snapped survivors. The
   example payload above becomes:
   `[(2026-06-20 → 2026-10-21), (2026-11-20 → ∞)]` (with `[1, 3]`
   weekdays the snapped boundaries land on Mon/Wed).
4. **Merge time_slots** (§2) — same fold on `HH:MM` strings.
5. **Reconcile with existing rows** — fetch all `AvailabilityWindow` rows
   for the same `(teacher_id, mode)` whose interval intersects any
   incoming merged range. Run snap+merge over the union, then `DELETE` the
   old rows and `INSERT` the new merged rows in a single transaction.
   This guarantees property §4.1 even under retries and races.
6. **Return** the canonical merged set so the client can replace local
   state without round-tripping.

Response:

```json
{
  "windows": [ /* AvailabilityWindow rows after merge */ ],
  "deleted_window_ids": [ /* ids removed during reconciliation */ ]
}
```

### Closed mode

`mode: "closed"` is a blackout — it should subtract from any overlapping
`mode: "open"` windows. Implementation strategy:

- Treat closed windows as "negative" intervals.
- After merging the closed payload, iterate matching open windows and
  **interval-subtract** the closed range, splitting the open window into
  up to two pieces. Persist the splits.
- Closed windows themselves are stored too (so the UI can render the
  user's "I am unavailable here" intent verbatim) but the slot resolver
  prefers `open MINUS closed` when answering "is this teacher available?".

---

## 6. Slot resolution (read path)

A separate question: given the merged windows, which 15-minute slots are
bookable on a specific date?

```
function bookableSlots(teacherId, date):
  windows = SELECT * FROM availability_window
            WHERE teacher_id = teacherId
              AND start_date <= date
              AND (end_date IS NULL OR end_date >= date)
              AND date.weekday IN window.weekdays
  open  = windows where mode = 'open'
  closed = windows where mode = 'closed'
  slots = flatMap(open.time_slots) MINUS flatMap(closed.time_slots)
  return mergeIntervals(slots)
```

The `MINUS` step is interval subtraction — same shape as §5 closed-mode
reconciliation but in time-of-day space.

---

## 7. Concurrency & idempotency

- The save endpoint must hold a **per-teacher advisory lock** (e.g. Postgres
  `pg_advisory_xact_lock(hashtext(teacher_id))`) for the duration of step 4.
  Without it, two simultaneous saves can each read a non-overlapping
  baseline, both merge cleanly, and both insert — producing an overlap
  that violates §4.1.
- Save is idempotent by construction: running it twice with the same
  payload yields the same canonical row set.
- Frontend should send a client-generated `request_id` (UUID) and the
  backend should dedupe on it for ~30s to absorb double-click retries.

---

## 8. Migration plan

The existing `Availability` rows
(`{teacher_id, day_of_week, start_time, end_time}`) carry no date window —
they're effectively "every week, forever, on this weekday at this time".
Migration path:

1. Create new `availability_window` table.
2. For each legacy row, insert one window:
   `start_date = today, end_date = NULL, weekdays = [day_of_week], time_slots = [{start_time, end_time}], mode = 'open'`.
3. Group/merge per teacher to collapse the seven legacy rows that often
   represent a single Mon–Fri 9–5 schedule.
4. Keep the old table read-only for one release; cut over the resolver
   (§6) once parity is verified.
5. Drop the legacy table.

---

## 9. Frontend reference

The reference implementation lives in
`src/components/calendar/CalendarSidebar.jsx`:

- `mergeTimeRows(rows)` — folds `HH:MM` time intervals.
- `mergeDateRanges(rows)` — folds date intervals; uses `noEndDate` flag to
  represent `∞`.
- `handleSave()` — calls both, then expands the merged ranges into per-day
  slots before handing them to the parent.

The Review Changes block consumes the same `mergeDateRanges` /
`mergeTimeRows` output, so what the user previews is what the backend
should receive (modulo the §5 reconciliation against existing rows).

---

## 10. Test cases the backend must pass

| Input ranges | Expected stored rows |
|---|---|
| `[20 Jun – 15 Jul, 10 Jul – 21 Oct]` | `[20 Jun – 21 Oct]` |
| `[1 Jan – 31 Jan, 1 Feb – 28 Feb]` | `[1 Jan – 31 Jan, 1 Feb – 28 Feb]` (NOT merged — gap of one day; spec uses `start <= end`, not `start <= end+1`) |
| `[1 Jan – 31 Jan, 31 Jan – 28 Feb]` | `[1 Jan – 28 Feb]` (touch on 31 Jan) |
| `[20 Jun – 21 Oct, 1 Jul – ∞]` (noEndDate) | `[20 Jun – ∞]` |
| `[5 Jul – 10 Jul, 1 Jul – 20 Jul, 8 Jul – 9 Jul]` | `[1 Jul – 20 Jul]` (multi-row absorb) |
| Times `[09:30 – 14:30, 13:30 – 18:30, 09:45 – 11:30]` | `[09:30 – 18:30]` |
| Times `[09:00 – 09:15, 09:30 – 09:45]` | unchanged (gap of 15 min, `start > prev.end`) |
| Time grid `[09:07 – 10:00]` | **REJECT** — fails 15-min increment validation |
| `[Tue 5 May – Thu 7 May]`, weekdays `[Thu]` | `[Thu 7 May – Thu 7 May]` (snap forward) |
| `[Mon 4 May – Sat 9 May]`, weekdays `[Mon, Wed]` | `[Mon 4 May – Wed 6 May]` (snap end backward — Sat unchecked) |
| `[Tue 5 May – Thu 7 May]`, weekdays `[Sat]` | **REJECT** — no Sat in window after snap |
| `[Mon 4 May – Fri 8 May, Sun 10 May – Fri 15 May]`, weekdays `[Mon]` | `[Mon 4 May – Mon 4 May, Mon 11 May – Mon 11 May]` (snap-then-merge: each row collapses to one Mon, gap remains) |
| Any range with weekdays `[]` | **REJECT** — empty weekday set is forbidden (§4.5) |
