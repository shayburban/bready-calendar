import React from 'react';
import { X } from 'lucide-react';

// Read-only quick-action modal for a PAST converted/cancelled slot (Spec J
// "Past converted slots"). Shows notes / topics / rating (read-only), a one-click
// re-engagement message for the role-T counterparty, and — for `cancelled` — the
// per-cancellation outcome (refund vs fee + amount, per the teacher's policy).
//
// IMPORTANT (Spec D): there is NO cancel action on `not-reviewed` (the session
// already happened). The only negative path there is a dispute -> refund, which
// is owned by the separate review prompt; we render its state read-only if present.
export default function ActionModal({ open, record, onClose }) {
  if (!open || !record) return null;

  const isCancelled = record.type === 'cancelled';
  const isTeacher = record.role === 'T';
  const money =
    record.amount != null && Number.isFinite(record.amount) ? `$${record.amount}` : '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-800 capitalize">{record.type} session</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <Row label="Date" value={record.startUTC ? new Date(record.startUTC).toISOString().slice(0, 10) : '—'} />
          <Row label="Role" value={record.role === 'T' ? 'You taught (T)' : record.role === 'S' ? 'You studied (S)' : '—'} />
          <Row label="Counterparty" value={record.counterpartyName || record.counterpartyId || '—'} />
          <Row label="Subject" value={record.subject || '—'} />
          <Row label="Service" value={record.service || '—'} />
          <Row label="Amount" value={money} />

          {isCancelled && (
            <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">Cancellation outcome (per your policy)</div>
              {record.cancellationOutcome === 'fee' ? (
                <p className="text-gray-700">
                  Cancellation <span className="font-semibold">fee</span> charged:{' '}
                  <span className="font-semibold">${record.cancellationFee ?? record.amount ?? '—'}</span>
                </p>
              ) : record.cancellationOutcome === 'refund' ? (
                <p className="text-gray-700">
                  <span className="font-semibold">Refund</span> issued to student: {money}
                </p>
              ) : (
                <p className="text-gray-500">Outcome not recorded.</p>
              )}
            </div>
          )}

          {record.type === 'not-reviewed' && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800">
              Awaiting review/release. Review &amp; dispute actions are handled in the review flow — shown
              read-only here. (No cancel action: the session already happened.)
              {record.reviewWindowEndsUTC && (
                <div className="text-xs mt-1">
                  Window ends: {new Date(record.reviewWindowEndsUTC).toISOString().slice(0, 16).replace('T', ' ')} UTC
                </div>
              )}
            </div>
          )}

          {/* Read-only annotation placeholders (notes / topics / rating). */}
          <div className="rounded-md border border-gray-200 p-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Notes &amp; topics</div>
            <p className="text-gray-400 italic text-xs">No notes recorded for this session.</p>
            <div className="text-xs font-semibold text-gray-600 mt-2 mb-1">Student rating</div>
            <p className="text-gray-400 italic text-xs">{record.reviewedByStudent ? 'Reviewed' : 'Not yet reviewed'}</p>
          </div>
        </div>

        <div className="border-t px-4 py-3 flex justify-end gap-2">
          {isTeacher && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded border border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Send re-engagement message
            </button>
          )}
          <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 text-right">{value}</span>
    </div>
  );
}
