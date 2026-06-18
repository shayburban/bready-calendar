import React, { useMemo } from 'react';
import { computeFunnel } from '@/data/statsHelpers';

// Conversion funnel (Spec D + G.2): availability/request -> waiting -> booked ->
// not-reviewed -> completed, with drop-offs (rejected at waiting, cancelled at
// booked only, disputed->refund at not-reviewed, wasted supply). Reschedules are
// shown separately and NEVER counted as new bookings.
export default function ConversionFunnel({ records }) {
  const funnel = useMemo(() => computeFunnel(records), [records]);
  const max = Math.max(1, ...funnel.stages.map((s) => s.value));

  return (
    <div>
      <div className="space-y-2">
        {funnel.stages.map((s) => {
          const pct = Math.round((s.value / max) * 100);
          return (
            <div key={s.key} className="flex items-center gap-3">
              <div className="w-32 text-xs text-gray-600 shrink-0">{s.label}</div>
              <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
                <div
                  className="h-6 bg-blue-500 rounded flex items-center justify-end pr-2 text-[11px] text-white font-semibold transition-all"
                  style={{ width: `${Math.max(pct, 6)}%` }}
                >
                  {s.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        <Dropoff label="Rejected" value={funnel.dropoffs.rejected} hint="at waiting" />
        <Dropoff label="Cancelled" value={funnel.dropoffs.cancelled} hint="from booked" />
        <Dropoff label="Disputed → refund" value={funnel.dropoffs.disputedRefund} hint="at not-reviewed" />
        <Dropoff label="Wasted supply" value={funnel.dropoffs.wastedSupply} hint="never booked" />
      </div>

      <p className="text-xs text-gray-500 mt-3">
        {funnel.reschedules} reschedule request(s) tracked separately — not counted as new bookings.
      </p>
    </div>
  );
}

function Dropoff({ label, value, hint }) {
  return (
    <div className="rounded border border-gray-200 bg-white px-3 py-2">
      <div className="text-lg font-bold text-gray-800">{value}</div>
      <div className="text-[11px] text-gray-500 leading-tight">{label}</div>
      <div className="text-[10px] text-gray-400">{hint}</div>
    </div>
  );
}
