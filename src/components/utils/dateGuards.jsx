
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const clampToPast = (iso) => {
  if (!iso) return iso;
  const t = todayISO();
  return iso > t ? t : iso;
};

export const keepStartBeforeEnd = (start, end) => {
  if (start && end && start > end) return { start, end: start };
  return { start, end };
};

// --- ADDITIONS: do not modify the existing helpers above ---

export const MIN_ISO_1920 = '1920-01-01';
const ISO10 = /^\d{4}-\d{2}-\d{2}$/;

// Treat exactly 'YYYY-MM-DD' (10 chars) as complete
export const isISOComplete = (s) => !!s && s.length === 10 && ISO10.test(s);

/**
 * Clamp only when the value is a complete ISO date (YYYY-MM-DD).
 * While typing (partial), return the raw input so the user can finish.
 */
export const clampToPast1920 = (iso) => {
  if (!iso) return iso;
  if (!isISOComplete(iso)) return iso; // Only clamp if it's a complete date string

  const today = todayISO(); // reuse existing helper
  if (iso > today) return today;
  if (iso < MIN_ISO_1920) return MIN_ISO_1920;
  return iso;
};

/**
 * If the field already has a full date (10 chars), block extra typing
 * unless user deletes/backspaces, uses nav keys, or selects text to overwrite.
 * Paste is allowed only when overwriting a selection.
 */
export const lockWhenCompleteKeyDown = (e) => {
  const input = e.target;
  if (!input) return;

  const value = input.value || '';
  const selStart = input.selectionStart ?? value.length;
  const selEnd   = input.selectionEnd   ?? value.length;
  const hasSelection = selStart !== selEnd;
  const isAtEnd      = selStart === value.length;

  // Always allow nav / delete / tab
  const allow = new Set([
    'Backspace','Delete','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','Tab'
  ]);
  if (allow.has(e.key)) return;

  // Allow select-all/copy/cut
  if ((e.ctrlKey || e.metaKey) && ['a','c','x'].includes(e.key.toLowerCase())) return;

  // Paste: allow only when overwriting selection if already full
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
    if (value.length >= 10 && !hasSelection) e.preventDefault();
    return;
  }

  // Printable filter
  const printable = e.key.length === 1 && !e.altKey && !e.ctrlKey && !e.metaKey;
  if (!printable) return;

  // Only digits or '-' allowed
  const isDigit = /[0-9]/.test(e.key);
  const isDash  = e.key === '-';
  if (!(isDigit || isDash)) {
    e.preventDefault();
    return;
  }

  // Enforce ISO shape: '-' only at index 4 and 7; digits not allowed there
  if (isDash && ![4, 7].includes(selStart)) { e.preventDefault(); return; }
  if (isDigit && [4, 7].includes(selStart)) { e.preventDefault(); return; }

  // Not full yet: allow normal typing
  if (value.length < 10) return;

  // Already full (10 chars)
  if (!hasSelection) {
    // Block extra typing at the end (user must move caret or select text)
    if (isAtEnd) {
      e.preventDefault();
      return;
    }

    // Overwrite exactly one character at caret (keeps length 10)
    e.preventDefault();
    input.setRangeText(e.key, selStart, selStart + 1, 'end');

    // Notify React controlled inputs
    const ev = new Event('input', { bubbles: true });
    input.dispatchEvent(ev);
    return;
  }

  // If there IS a selection, default overwrite is fine.
};

// Opens native date picker if supported; otherwise allows typing fallback.
export const openDatePicker = (e) => {
  const input = e?.currentTarget || e?.target;
  if (!input) return;

  // Attempt to open the native date picker.
  // If the browser supports showPicker for this input type, it will open.
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker();
    } catch (error) {
      // Log if it fails, but don't block. The user can still type if this happens.
      console.warn("Failed to open date picker via showPicker():", error);
    }
  }
  // If showPicker is not supported, or the call above failed,
  // we implicitly fall back to allowing typing, as the input is no longer 'readOnly'.
};

// Block typing when a native picker exists; keep nav keys working.
// If no native picker, do not block typing (fallback stays usable).
export const blockTypingOnDate = (e) => {
  const input = e?.currentTarget || e?.target;
  if (!input) return;

  // Only prevent typing if the browser has the 'showPicker' function,
  // implying a native picker is the primary interaction method.
  if (typeof input.showPicker === 'function') {
    // Allow navigation keys, Tab, Shift, Enter, Escape, and modifier keys (Ctrl, Alt, Meta).
    const allow = new Set([
      'Tab', 'Shift', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End',
      'Control', 'Alt', 'Meta' // Allow modifier keys
    ]);

    // Prevent default for printable characters (single key presses)
    // that are not allowed (e.g., letters, symbols) AND not modifier-key combinations.
    if (e.key.length === 1 && !allow.has(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
    }
  }
  // If showPicker is not a function (i.e., browser doesn't support native picker),
  // we DO NOT preventDefault, allowing the user to type freely.
};
