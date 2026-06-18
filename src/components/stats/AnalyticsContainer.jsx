import React, { useMemo, useState } from 'react';
import {
  applyFilters,
  periodRange,
  computeUtilization,
  computeWastedSupply,
  detectDeadZones,
  computeRates,
  computePeople,
  toDrawerRows,
} from '@/data/statsHelpers';
import StatsErrorBoundary from './StatsErrorBoundary';
import ConversionHeatmap from './ConversionHeatmap';
import ConversionFunnel from './ConversionFunnel';
import EscrowSummary from './EscrowSummary';
import EventDrawer from './EventDrawer';
import ActionModal from './ActionModal';

// AnalyticsContainer (Spec J) — all new analytics live in ONE full-width
// container rendered BELOW the existing STAT_CARDS grid. Owns the working
// slicers, applies the period + slicer filters once, and feeds every subsection
// from the SAME filtered record list. Each subsection is wrapped in an error
// boundary so one failing metric never blanks the page.
export default function StatsAnalyticsContainer({ records, loading, error, source, period }) {
  const [slicers, setSlicers] = useState({ subject: '', service: '', referred: '', student: '' });

  const { subjects, services } = useMemo(() => {
    const subj = new Set();
    const serv = new Set();
    for (const r of records || []) {
      if (r.subject) subj.add(r.subject);
      if (r.service) serv.add(r.service);
    }
    return { subjects: [...subj].sort(), services: [...serv].sort() };
  }, [records]);

  // Single filter pass: period window + slicers (Spec G "Slicers"). Memoized.
  const filtered = useMemo(() => {
    const { fromUTC, untilUTC } = periodRange(period);
    return applyFilters(records || [], {
      fromUTC,
      untilUTC,
      student: slicers.student || undefined,
      subject: slicers.subject || undefined,
      service: slicers.service || undefined,
      referred: slicers.referred === '' ? undefined : slicers.referred === 'yes',
    });
  }, [records, period, slicers]);

  // Loss & Efficiency metrics (Spec G.3).
  const util = useMemo(() => computeUtilization(filtered), [filtered]);
  const wasted = useMemo(() => computeWastedSupply(filtered), [filtered]);
  const deadZones = useMemo(() => detectDeadZones(filtered), [filtered]);
  const rates = useMemo(() => computeRates(filtered), [filtered]);
  const people = useMemo(() => computePeople(filtered), [filtered]);

  // Drill-down drawer + read-only action modal for an individual record.
  const [drawer, setDrawer] = useState({ open: false, title: '', rows: [] });
  const [actionRecord, setActionRecord] = useState(null);
  const onDrill = (title, predicate) => {
    setDrawer({ open: true, title, rows: toDrawerRows(filtered, predicate) });
  };
  const openRecord = (id) => {
    const rec = (filtered || []).find((r) => r.id === id);
    if (rec) setActionRecord(rec);
  };

  if (loading) return <AnalyticsSkeleton />;

  if (error && (!records || records.length === 0)) {
    return (
      <div className="w-full mt-8 rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
        Statistics data isn’t available right now. {source === 'supabase' ? 'No bookings have synced yet.' : ''}
      </div>
    );
  }

  const isEmpty = !records || records.length === 0;

  return (
    <div className="w-full space-y-6 mt-8">
      {/* Working slicers over all analytics below (existing-style controls). */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <SlicerSelect
          label="Subject"
          value={slicers.subject}
          onChange={(v) => setSlicers((s) => ({ ...s, subject: v }))}
          options={subjects}
        />
        <SlicerSelect
          label="Service"
          value={slicers.service}
          onChange={(v) => setSlicers((s) => ({ ...s, service: v }))}
          options={services}
        />
        <SlicerSelect
          label="Referred"
          value={slicers.referred}
          onChange={(v) => setSlicers((s) => ({ ...s, referred: v }))}
          options={['yes', 'no']}
        />
        <div className="flex flex-col">
          <label className="text-[11px] text-gray-500 mb-1">Student</label>
          <input
            type="text"
            value={slicers.student}
            onChange={(e) => setSlicers((s) => ({ ...s, student: e.target.value }))}
            placeholder="Search a student"
            className="h-8 px-2 text-sm border rounded"
            aria-label="Filter by student"
          />
        </div>
        <button
          type="button"
          onClick={() => setSlicers({ subject: '', service: '', referred: '', student: '' })}
          className="h-8 px-3 text-sm rounded border text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {isEmpty ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500 text-center">
          No statistics to show yet. Once you publish availability and run lessons, your analytics will appear here.
        </div>
      ) : (
        <>
          {/* (1) Conversion & Demand — heatmap + funnel, side-by-side desktop. */}
          <Section title="Conversion & Demand">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatsErrorBoundary label="Conversion heatmap">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Availability → Booked conversion</h4>
                  <ConversionHeatmap records={filtered} />
                </div>
              </StatsErrorBoundary>
              <StatsErrorBoundary label="Conversion funnel">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Conversion funnel</h4>
                  <ConversionFunnel records={filtered} />
                </div>
              </StatsErrorBoundary>
            </div>
          </Section>

          {/* (2) Loss & Efficiency. */}
          <Section title="Loss & Efficiency">
            <StatsErrorBoundary label="Loss & efficiency">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric
                  label="Fill / Utilization"
                  value={`${Math.round(util.rate * 100)}%`}
                  sub={`${util.bookedHours}h booked / ${util.availableHours + util.bookedHours}h`}
                />
                <Metric
                  label="Unbooked supply"
                  value={`${Math.round(wasted.pctUnbooked * 100)}%`}
                  sub={`${wasted.idleHours}h idle`}
                  onClick={() =>
                    onDrill('Expired availability (never booked)', (r) =>
                      r.type === 'availability' && r.role === 'T' && !r.bookedAtUTC
                    )
                  }
                />
                <Metric
                  label="Cancellation rate"
                  value={`${Math.round(rates.cancellationRate * 100)}%`}
                  sub={`${rates.cancelled} cancelled`}
                  onClick={() => onDrill('Cancellations', (r) => r.type === 'cancelled')}
                />
                <Metric
                  label="Reschedule rate"
                  value={`${Math.round(rates.rescheduleRate * 100)}%`}
                  sub={`${rates.reschedules} reschedules`}
                  onClick={() => onDrill('Reschedules', (r) => r.isReschedule)}
                />
              </div>

              {deadZones.length > 0 && (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <h5 className="text-sm font-semibold text-emerald-800 mb-1">Dead-zone suggestions</h5>
                  <ul className="space-y-1">
                    {deadZones.map((d, i) => (
                      <li key={i} className="text-xs text-emerald-800">
                        • {d.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric label="Unique students" value={people.uniqueStudents} sub="role T" />
                <Metric label="Unique teachers booked" value={people.uniqueTeachers} sub="role S" />
                <Metric label="Weekly teaching load" value={`${people.teachingHours}h`} sub="role T total" />
                <Metric
                  label="Top student (hrs)"
                  value={people.topStudents[0] ? `${people.topStudents[0].hours}h` : '—'}
                  sub={people.topStudents[0]?.id || ''}
                />
              </div>
            </StatsErrorBoundary>
          </Section>

          {/* (3) Money & Lifecycle. */}
          <Section title="Money & Lifecycle">
            <StatsErrorBoundary label="Money & lifecycle">
              <EscrowSummary records={filtered} onDrill={onDrill} />
            </StatsErrorBoundary>
          </Section>
        </>
      )}

      <EventDrawer
        open={drawer.open}
        title={drawer.title}
        rows={drawer.rows}
        onRowClick={openRecord}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
      <ActionModal open={!!actionRecord} record={actionRecord} onClose={() => setActionRecord(null)} />
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Metric({ label, value, sub, onClick }) {
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
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-800 mt-1">{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</div>}
    </button>
  );
}

function SlicerSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 px-2 text-sm border rounded bg-white"
        aria-label={`Filter by ${label}`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="w-full mt-8 space-y-4" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
