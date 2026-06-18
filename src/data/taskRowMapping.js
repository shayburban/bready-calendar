// Map ONE normalized booking record (the single source of truth produced by
// normalizeEvents) -> the display "task row" the page + sidebar render. Pure /
// presentational: it formats and labels, it never invents booking facts.
//
// Field mapping follows Spec F. Money/time are taken pre-computed off the record
// (hourlyRate / amount / startUTC / endUTC) — no client float division here.

import { TITLE_OPTIONS } from './teacherTasks';
import {
  formatDateDDMMYYYY,
  formatTimeRange,
  formatMoney,
  formatDuration,
  classifyTodoDone,
} from './taskFormatters';

// Reuse the existing legend colour tokens (no new palette).
const COLOR_BY_TYPE = TITLE_OPTIONS.reduce((acc, o) => {
  acc[o.id] = o.color;
  return acc;
}, {});

// type + role -> the existing display label.
function typeLabel(type, role) {
  switch (type) {
    case 'availability':
      return 'Availability';
    case 'waiting':
      return 'Waiting For Confirmation';
    case 'booked':
      return role ? `Booked(${role})` : 'Booked';
    case 'not-reviewed':
      return 'Not Reviewed';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'synced':
      return 'Synced Calendar Events';
    default:
      return type || '—';
  }
}

export function mapRecordToTaskRow(record, { nowMs = Date.now(), tz } = {}) {
  const role = record.role || null;
  return {
    id: record.id,
    perspective: role, // 'T' | 'S' — drives the All / Teacher / Student tabs
    name: record.counterpartyName || record.counterpartyId || '—',
    type: typeLabel(record.type, role),
    typeKey: record.type,
    typeColor: COLOR_BY_TYPE[record.type] || 'bg-gray-400',
    date: formatDateDDMMYYYY(record.startUTC, tz),
    time: formatTimeRange(record.startUTC, record.endUTC, tz),
    duration: formatDuration(record.durationHours),
    rate: formatMoney(record.hourlyRate), // pre-computed; '—' when unbacked (live)
    total: formatMoney(record.amount),
    deposited: !!record.deposited,
    subject: record.subject || '',
    service: record.service || '',
    referred: !!record.referred,
    oldRate: record.oldRate || '',
    // reschedule proposal (for Accept/Decline in Phase 2)
    reschedule: !!record.isReschedule,
    rescheduleProposedUTC: record.proposedStartUTC || null,
    rescheduleProposedBy: record.proposedBy || null,
    status: record.status || null,
    isDemo: !!record.isDemo,
    bucket: classifyTodoDone(record, nowMs), // 'todo' | 'done'
    record, // keep the source record for drill-down / mutations (Phase 2)
  };
}

export function mapRecordsToTaskRows(records, opts) {
  return (records || []).map((r) => mapRecordToTaskRow(r, opts));
}
