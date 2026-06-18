import React, { useMemo } from 'react';
import { computeMoneyEscrow, computeLifecycle } from '@/data/statsHelpers';

// Money & escrow + lifecycle/pipeline (Spec G.4 + G.5). Money figures come ONLY
// from finance/seed amounts and never contradict TeacherFinance. Fields the
// active source lacks render "—" (A#11) — e.g. mock has no escrow data.
const fmtMoney = (v) => (v === '—' || v == null ? '—' : `$${v}`);
const fmtPct = (v) => (v == null ? '—' : `${Math.round(v * 100)}%`);

export default function EscrowSummary({ records, onDrill }) {
  const money = useMemo(() => computeMoneyEscrow(records), [records]);
  const life = useMemo(() => computeLifecycle(records), [records]);

  const TYPES = ['availability', 'waiting', 'booked', 'not-reviewed', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      {/* Escrow money cards (drill-downs open the underlying rows). */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MoneyCard
          title="In Escrow (held)"
          value={fmtMoney(money.inEscrow)}
          sub="role-T booked"
          onClick={() => onDrill?.('In Escrow (held)', (r) => r.role === 'T' && r.type === 'booked')}
        />
        <MoneyCard
          title="Pending Release"
          value={fmtMoney(money.pendingRelease)}
          sub="awaiting review (Not Received)"
          onClick={() => onDrill?.('Pending Release', (r) => r.role === 'T' && r.type === 'not-reviewed')}
        />
        <MoneyCard
          title="Released to Wallet"
          value={fmtMoney(money.released)}
          sub={`reviewed ${fmtMoney(money.reviewedReleased)} · auto ${fmtMoney(money.autoReleased)}`}
          onClick={() => onDrill?.('Released to Wallet', (r) => r.role === 'T' && r.type === 'completed')}
        />
        <MoneyCard
          title="Review Rate"
          value={fmtPct(money.reviewRate)}
          sub="of not-reviewed reviewed"
        />
      </div>

      {/* Cancellations & disputes. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MoneyCard
          title="Refunds"
          value={fmtMoney(money.refunds)}
          sub={`${money.refundCount} cancellation(s)`}
          onClick={() => onDrill?.('Refunds', (r) => r.type === 'cancelled' && r.cancellationOutcome === 'refund')}
        />
        <MoneyCard
          title="Cancellation Fees"
          value={fmtMoney(money.fees)}
          sub={`${money.feeCount} cancellation(s) · per policy`}
          onClick={() => onDrill?.('Cancellation Fees', (r) => r.type === 'cancelled' && r.cancellationOutcome === 'fee')}
        />
        <MoneyCard
          title="Disputes"
          value={money.disputeCount}
          sub={`refund ${money.disputeRefunded} · release ${money.disputeReleased}`}
          onClick={() => onDrill?.('Disputes', (r) => r.disputeOpen)}
        />
        <MoneyCard
          title="Reschedules"
          value={life.reschedule.total}
          sub={`accept ${life.reschedule.accepted} · decline ${life.reschedule.declined}`}
          onClick={() => onDrill?.('Reschedules', (r) => r.isReschedule)}
        />
      </div>

      {/* Lifecycle state counts by role + booking-request pipeline. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Lifecycle states (by role)</h4>
          <table className="w-full text-xs">
            <thead className="text-gray-500">
              <tr className="text-left">
                <th className="py-1">State</th>
                <th className="py-1 text-right">Teacher (T)</th>
                <th className="py-1 text-right">Student (S)</th>
              </tr>
            </thead>
            <tbody>
              {TYPES.map((t) => (
                <tr key={t} className="border-t border-gray-100">
                  <td className="py-1 capitalize text-gray-700">{t}</td>
                  <td className="py-1 text-right">{life.stateCounts[t].T}</td>
                  <td className="py-1 text-right">{life.stateCounts[t].S}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Booking-request pipeline</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Pill label="Requests" value={life.pipeline.requests} />
            <Pill label="Accepted" value={life.pipeline.accepted} />
            <Pill label="Rejected" value={life.pipeline.rejected} />
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            Rejected requests are tracked drop-offs, not bookings. A reschedule is never a new booking.
          </p>
        </div>
      </div>
    </div>
  );
}

function MoneyCard({ title, value, sub, onClick }) {
  const clickable = typeof onClick === 'function';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`text-left rounded-lg border border-gray-200 bg-white p-3 ${
        clickable ? 'hover:border-blue-400 hover:shadow-sm cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-bold text-gray-800 mt-1">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </button>
  );
}

function Pill({ label, value }) {
  return (
    <div className="rounded bg-gray-50 border border-gray-200 py-2">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}
