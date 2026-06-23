// Deterministic Google event ids + instance ids (server-only).
//
// Google event-id rules: characters from base32hex (0-9 a-v), length 5-1024,
// lowercase. A SHA-256 digest base32hex-encoded is 52 chars in exactly that
// alphabet, so retries produce the SAME id => events.insert is idempotent
// (re-insert returns 409 = already done) and we never store Google's id.
//
// See docs/google-calendar-sync-v1.md §4.

import { createHash } from 'node:crypto';

// RFC 4648 base32hex alphabet: 0-9 then a-v (exactly Google's allowed charset).
const B32HEX = '0123456789abcdefghijklmnopqrstuv';

function base32hex(buf) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32HEX[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32HEX[(value << (5 - bits)) & 31];
  return out;
}

// Deterministic master event id for a booking/series on a given calendar owner.
//   key  : booking.id (one-off) OR booking.recurrence_id (series)
//   role : 'teacher' | 'student'  (same booking, two calendars, two ids)
// Returns a 52-char base32hex string, prefixed 'b' to guarantee a letter start.
export function masterEventId(key, role) {
  const digest = createHash('sha256').update(`bready:${role}:${key}`).digest();
  return ('b' + base32hex(digest)).slice(0, 60); // well under the 1024 cap
}

// 'YYYYMMDDTHHMMSSZ' (UTC) for an epoch-ms instant — the instance suffix Google
// uses to address one occurrence of a recurring master.
export function compactUTC(ms) {
  const d = new Date(ms);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
}

// The id of a single occurrence of a recurring master (for instance exceptions).
//   masterEventId_YYYYMMDDTHHMMSSZ  (original occurrence start, UTC)
export function instanceEventId(masterId, originalStartMs) {
  return `${masterId}_${compactUTC(originalStartMs)}`;
}
