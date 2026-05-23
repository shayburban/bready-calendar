// Shared browser-native CSS validity probe. Parse-only and unbiased by host
// stylesheets, so it is the authoritative syntactic gate for the sanitizer.
// Falls back to "allow" only when CSS.supports is unavailable (the string
// blacklist still applies); injectable as a stub in Node tests.

export function cssSupports(prop, val) {
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') {
    try {
      return CSS.supports(prop, val);
    } catch {
      return false;
    }
  }
  return true;
}
