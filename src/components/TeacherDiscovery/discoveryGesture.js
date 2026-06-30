// =============================================================================
// Teacher Discovery — pure gesture math (no DOM, deterministic, unit-testable).
//
// Ported verbatim from the Claude Design project "Teacher Discovery.dc.html"
// (the Bumble-style swipe-to-book phone screen). These two functions are the
// highest-priority code: they decide scroll-vs-swipe and commit a decision.
// Keep them pure so `discoveryGesture.test.js` can prove the thresholds.
// =============================================================================

export const DEADZONE = 12;        // px of horizontal travel before a swipe engages
export const SWIPE_RATIO = 0.32;   // fraction of card width that commits a decision
export const VELOCITY = 0.55;      // px/ms flick speed that commits regardless of distance
export const DOMINANCE = 1.2;      // horizontal must beat vertical by this factor to be a swipe

/**
 * Is this gesture a horizontal swipe (vs. a vertical scroll)?
 * Horizontal must clear the deadzone AND dominate the vertical component.
 * @param {number} dx horizontal travel (px)
 * @param {number} dy vertical travel (px)
 * @returns {boolean}
 */
export function isHorizontalSwipe(dx, dy) {
  return Math.abs(dx) > DEADZONE && Math.abs(dx) > Math.abs(dy) * DOMINANCE;
}

/**
 * Outcome on pointer release.
 * @param {number} offsetX   horizontal offset at release (px)
 * @param {number} velocityX horizontal velocity at release (px/ms)
 * @param {number} cardWidth card width (px)
 * @param {number} [ratio]   override for SWIPE_RATIO (the design exposes this as `swipeSensitivity`)
 * @returns {"book"|"pass"|null} null = below threshold → spring back
 */
export function decideSwipe(offsetX, velocityX, cardWidth, ratio = SWIPE_RATIO) {
  const past = Math.abs(offsetX) > cardWidth * ratio;
  const flick = Math.abs(velocityX) > VELOCITY;
  if (!past && !flick) return null;
  return offsetX > 0 ? 'book' : 'pass';
}
