// AES-256-GCM token encryption for Google OAuth tokens (server-only).
//
// Refresh/access tokens are NEVER stored in plaintext. Ciphertext format is
// `iv:tag:data`, each part base64 — self-describing so decrypt needs only the key.
// Key: CALENDAR_TOKEN_ENC_KEY, a 32-byte key base64-encoded (generate with
// `openssl rand -base64 32`). Chosen over pgsodium/Vault for portability — see
// docs/google-calendar-sync-v1.md §5.

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';

function key() {
  const b64 = process.env.CALENDAR_TOKEN_ENC_KEY;
  if (!b64) throw new Error('CALENDAR_TOKEN_ENC_KEY is not set');
  const k = Buffer.from(b64, 'base64');
  if (k.length !== 32) throw new Error('CALENDAR_TOKEN_ENC_KEY must decode to 32 bytes');
  return k;
}

// string -> 'iv:tag:data' (all base64). Returns null for null/empty input.
export function encryptToken(plaintext) {
  if (!plaintext) return null;
  const iv = randomBytes(12); // 96-bit nonce, standard for GCM
  const cipher = createCipheriv(ALGO, key(), iv);
  const data = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, data].map((b) => b.toString('base64')).join(':');
}

// 'iv:tag:data' -> string. Returns null for null/empty input. Throws on tamper.
export function decryptToken(ciphertext) {
  if (!ciphertext) return null;
  const [ivB64, tagB64, dataB64] = String(ciphertext).split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('malformed ciphertext');
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
