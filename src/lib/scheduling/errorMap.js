// RPC-error → §4 error_code + §7 message mapping. Pure (no Supabase import) so
// it is unit-testable. The scheduling RPCs RAISE bare tokens ('SLOT_TAKEN', …).

import { MSG, fillMessage } from '@/lib/scheduling/messages';

export const TOKEN_MAP = {
  OFF_GRID: { code: 'OFF_GRID', msgKey: 'off_grid' },
  INSIDE_NOTICE: { code: 'INSIDE_NOTICE', msgKey: 'inside_notice' },
  OUTSIDE_WINDOW: { code: 'OUTSIDE_WINDOW', msgKey: 'outside_window' },
  SLOT_TAKEN: { code: 'SLOT_TAKEN', msgKey: 'slot_taken' },
  BREAK_CONFLICT: { code: 'BREAK_CONFLICT', msgKey: 'slot_taken' },
  OVERLAP: { code: 'OVERLAP', msgKey: 'slot_taken' },
  HOLD_LIMIT: { code: 'HOLD_LIMIT', msgKey: 'too_many_holds' },
  HOLD_EXPIRED: { code: 'HOLD_EXPIRED', msgKey: 'slot_lost' },
  SLOT_LOST: { code: 'SLOT_LOST', msgKey: 'slot_lost' },
  PAYMENT_FAILED: { code: 'PAYMENT_FAILED', msgKey: 'payment_failed' },
  RESCHEDULE_EXPIRED: { code: 'RESCHEDULE_EXPIRED', msgKey: 'reschedule_expired' },
  CONFLICT_APPEARED: { code: 'CONFLICT_APPEARED', msgKey: 'reschedule_conflict' },
  NO_STUDENT: { code: 'NO_STUDENT', msgKey: 'slot_lost' },
  RESCHEDULE_EXISTS: { code: 'RESCHEDULE_EXISTS', msgKey: 'reschedule_conflict' },
  NOT_FOUND: { code: 'NOT_FOUND', msgKey: null },
};

// Extract the leading known TOKEN from a Supabase/Postgres error and map it.
// tokens = substitution values for {L}/{W}/{countdown} placeholders (§7).
export const mapRpcError = (error, tokens = {}) => {
  const raw = (error && (error.message || String(error))) || '';
  // Find the FIRST all-caps token that is a known code (avoids matching
  // "ERROR"/"LINE"/"PL"/"SQL" noise in Postgres error text).
  const matches = raw.match(/\b[A-Z_]{3,}\b/g) || [];
  const token = matches.find((t) => TOKEN_MAP[t]) || null;
  const entry = token ? TOKEN_MAP[token] : { code: 'UNKNOWN', msgKey: null };
  const message = entry.msgKey ? fillMessage(MSG[entry.msgKey], tokens) : raw;
  return { code: entry.code, message };
};
