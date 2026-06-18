import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';

// Drill-down side drawer (Spec J "Drill-down"): a paginated, READ-ONLY list of
// the underlying normalized event rows. Opening any stat shows the rows behind
// it. Nothing here mutates history (A#2).
const PAGE_SIZE = 8;

export default function EventDrawer({ open, title, rows, onClose, onRowClick }) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [rows, open]);

  const pageCount = Math.max(1, Math.ceil((rows?.length || 0) / PAGE_SIZE));
  const pageRows = useMemo(
    () => (rows || []).slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-xs text-gray-500">{rows?.length || 0} record(s) · read-only</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {(!rows || rows.length === 0) ? (
            <p className="text-sm text-gray-500 p-4 text-center">No records for this metric.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-gray-500">
                <tr className="text-left">
                  <th className="py-1 pr-2">Date</th>
                  <th className="py-1 pr-2">Type</th>
                  <th className="py-1 pr-2">Role</th>
                  <th className="py-1 pr-2">Counterparty</th>
                  <th className="py-1 pr-2">Hrs</th>
                  <th className="py-1 pr-2">Money</th>
                  <th className="py-1">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-t border-gray-100 text-gray-700 ${
                      onRowClick ? 'cursor-pointer hover:bg-blue-50' : ''
                    }`}
                    onClick={onRowClick ? () => onRowClick(r.id) : undefined}
                  >
                    <td className="py-1 pr-2 whitespace-nowrap">{r.date}</td>
                    <td className="py-1 pr-2">{r.type}</td>
                    <td className="py-1 pr-2">{r.role}</td>
                    <td className="py-1 pr-2 truncate max-w-[90px]" title={String(r.counterparty)}>
                      {r.counterparty}
                    </td>
                    <td className="py-1 pr-2">{r.durationHours}</td>
                    <td className="py-1 pr-2">{r.moneyState}</td>
                    <td className="py-1">{r.outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2 py-1 rounded border disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-gray-500">
              Page {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="px-2 py-1 rounded border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
