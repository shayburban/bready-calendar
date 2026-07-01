import { createClient } from '@supabase/supabase-js';

// Strip any stray non-Latin-1 characters (a zero-width space / BOM pasted into
// the env var) and surrounding whitespace. supabase-js sets the anon key as the
// `apikey`/`Authorization` request headers; a single code point > 0xFF makes
// Headers.set() throw "String contains non ISO-8859-1 code point", which kills
// EVERY RPC (e.g. search_teachers → the teacher listing silently falls back to
// mock). Supabase URLs and JWT anon keys are pure ASCII, so this is a no-op for
// a clean value and only removes corruption.
const clean = (s) => (typeof s === 'string' ? s.replace(/[^\x00-\xFF]/g, '').trim() : s);

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const anonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!url || !anonKey) {
  throw new Error(
    'Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env locally and on Vercel.'
  );
}

export const supabase = createClient(url, anonKey);
