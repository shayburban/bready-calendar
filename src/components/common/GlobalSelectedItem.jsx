
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { X, Paperclip } from 'lucide-react';

// Tiny black/white tooltip (no external deps)
const Tip = ({ label, children }) => (
  <span className="relative inline-flex items-center group">
    {children}
    <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2
                     whitespace-nowrap rounded bg-black text-white text-[10px]
                     px-2 py-1 opacity-0 group-hover:opacity-100 transition shadow">
      {label}
    </span>
  </span>
);

// === ADD: Generic error helpers for reuse across the app ===
export const extractErrorMessages = (errors) => {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors.filter(Boolean);
  // object shape {field: 'message' | ''} -> keep only truthy messages
  return Object.values(errors).filter(Boolean);
};

// Returns Tailwind classes to apply a red outline when an input has an error *and* we should show errors.
export const outlineIfError = (shouldShow, hasError) =>
  shouldShow && hasError
    ? 'border-red-500 focus:ring-1 focus:ring-red-500'
    : 'border-input focus:ring-1 focus:ring-ring';

export default function GlobalSelectedItem({
  title,
  subtitle,
  status = 'default',
  notes,
  notesExpanded = false,
  onToggleNotes,
  onRemove,
  onClick,
  className = '',
  variant = 'default',
  previewLabel = 'Live preview',
  showErrorSummary = false,
  attempted = false,
  errorList = [],
  errorSummaryTitle = 'Please fix the following:',
  // NEW (optional): show a file action inside preview
  fileUrl,
  fileLabel = 'View file',
  fileAriaLabel = 'View uploaded file',
  // NEW (optional): accept dates directly if caller prefers (non-breaking)
  startDate,
  endDate,
}) {
  const isInteractive = Boolean(onClick);
  const handleKeyDown = (e) => {
    if (!isInteractive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };

  return (
    <div
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`flex flex-col justify-between p-3 rounded-lg border
                  ${variant === 'preview'
                    ? 'bg-blue-50 border-blue-300 border-dashed ring-1 ring-blue-200/60'
                    : 'bg-gray-50 border-gray-200'}
                  ${onClick ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                  ${className}`}
    >
      {variant === 'preview' && (
        <div className="mb-1">
          <span className="text-[10px] leading-4 uppercase tracking-wider font-semibold
                           text-blue-700 bg-white/60 border border-blue-200 px-2 py-0.5 rounded">
            {previewLabel}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="font-medium block break-words">
            {title}
            {status === 'pending' && (
              <span className="text-yellow-600 font-semibold text-xs ml-2 align-middle">
                (Pending)
              </span>
            )}
          </span>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-0.5 break-words">{subtitle}</p>
          )}
        </div>

        {variant === 'preview' && fileUrl && (
          <Tip label="View uploaded document">
            <Button variant="outline" size="sm" asChild className="flex-shrink-0">
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={fileAriaLabel}>
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {fileLabel}
                </span>
              </a>
            </Button>
          </Tip>
        )}

        {onRemove && (
          <Tip label="Remove">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="flex-shrink-0"
              aria-label="Remove item"
            >
              <X className="w-4 h-4" />
            </Button>
          </Tip>
        )}
      </div>

      {!!(notes || startDate || endDate) && (
        <div className="mt-2">
          {onToggleNotes ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleNotes(); }}
                className="text-blue-600 hover:underline text-xs font-medium"
              >
                {notesExpanded ? 'Hide Notes' : 'View Notes'}
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden
                ${notesExpanded ? 'max-h-40 mt-2 pt-2 border-t border-gray-200' : 'max-h-0'}`}
              >
                <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {notes ?? `${startDate || '—'} to ${endDate || '—'}`}
                </p>
              </div>
            </>
          ) : (
            // PREVIEW default: show dates/notes inline with no toggle
            <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
              {notes ?? `${startDate || '—'} to ${endDate || '—'}`}
            </p>
          )}
        </div>
      )}

      {/* === ADD: Optional, generic error summary === */}
      {showErrorSummary && attempted && Array.isArray(errorList) && errorList.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-800 text-sm font-medium mb-2">{errorSummaryTitle}</p>
          <ul className="text-red-700 text-sm list-disc list-inside space-y-1">
            {errorList.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
