import React, { useMemo } from 'react';
import { computeConversionGrid, detectDeadZones, weekdayLabel, formatHour } from '@/data/statsHelpers';
import { HEATMAP_COLORS } from '@/data/statsConfig';

// Conversion heatmap (Spec J). Booking conversion to `booked` per (weekday x
// hour) for role-T availability. Inverted-intensity colour scale (warm = high):
//   HIGH (>=67%)  -> RED      (books reliably / "hot")
//   MEDIUM (34-66%) -> ORANGE
//   LOW (<34%, incl 0%) -> GREEN (the EXACT availability open-slot token)
//   dead-zone (0%, >= threshold) -> deepest GREEN + flagged
//   no-data (never offered) -> NEUTRAL gray (never green)
// Built as a CSS grid with colour-intensity cells (no new chart dependency).

function bandColor(cell, isDeadZone) {
  if (!cell || cell.band === 'no-data') return HEATMAP_COLORS.noData;
  if (cell.band === 'high') return HEATMAP_COLORS.high;
  if (cell.band === 'medium') return HEATMAP_COLORS.medium;
  // low band: 0% (or dead-zone) gets the deepest green; otherwise the open-slot green.
  if (isDeadZone || cell.conversion === 0) return HEATMAP_COLORS.lowDeep;
  return HEATMAP_COLORS.low;
}

function textColor(cell) {
  if (!cell || cell.band === 'no-data') return '#9ca3af';
  return '#ffffff';
}

export default function ConversionHeatmap({ records }) {
  const { grid, hours, deadSet } = useMemo(() => {
    const grid = computeConversionGrid(records);
    const byCell = {};
    const hourSet = new Set();
    for (const c of grid) {
      byCell[`${c.weekday}|${c.hour}`] = c;
      hourSet.add(c.hour);
    }
    const dz = detectDeadZones(records);
    const deadSet = new Set(dz.map((d) => `${d.weekday}|${d.hour}`));
    return {
      grid: byCell,
      hours: [...hourSet].sort((a, b) => a - b),
      deadSet,
    };
  }, [records]);

  const weekdays = [0, 1, 2, 3, 4, 5, 6];

  if (hours.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No role-as-teacher availability yet — conversion heatmap will populate once you publish open slots.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }} aria-label="Booking conversion heatmap by weekday and hour">
          <thead>
            <tr>
              <th className="text-xs text-gray-400 font-normal pr-2 text-right" />
              {weekdays.map((wd) => (
                <th key={wd} className="text-xs font-medium text-gray-600 px-1 pb-1">
                  {weekdayLabel(wd)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hr) => (
              <tr key={hr}>
                <td className="text-xs text-gray-500 pr-2 text-right whitespace-nowrap">{formatHour(hr)}</td>
                {weekdays.map((wd) => {
                  const cell = grid[`${wd}|${hr}`];
                  const isDead = deadSet.has(`${wd}|${hr}`);
                  const pct = cell && cell.conversion != null ? Math.round(cell.conversion * 100) : null;
                  const label =
                    cell && cell.band !== 'no-data'
                      ? `${weekdayLabel(wd)} ${formatHour(hr)} — ${pct}% (${cell.booked}/${cell.offered})${isDead ? ' · dead-zone' : ''}`
                      : `${weekdayLabel(wd)} ${formatHour(hr)} — not offered`;
                  return (
                    <td key={wd} className="p-0">
                      <div
                        title={label}
                        aria-label={label}
                        className="w-10 h-8 rounded flex items-center justify-center text-[10px] font-semibold"
                        style={{ backgroundColor: bandColor(cell, isDead), color: textColor(cell) }}
                      >
                        {pct != null ? `${pct}%` : ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mandatory mini-legend — the inverted semantics must be unambiguous. */}
      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
        <LegendDot color={HEATMAP_COLORS.high} label="High (books reliably)" />
        <LegendDot color={HEATMAP_COLORS.medium} label="Medium" />
        <LegendDot color={HEATMAP_COLORS.low} label="Low / still open" />
        <LegendDot color={HEATMAP_COLORS.lowDeep} label="0% / dead-zone" />
        <LegendDot color={HEATMAP_COLORS.noData} label="Not offered" border />
      </div>
    </div>
  );
}

function LegendDot({ color, label, border }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block w-3 h-3 rounded"
        style={{ backgroundColor: color, border: border ? '1px solid #d1d5db' : 'none' }}
      />
      {label}
    </span>
  );
}
