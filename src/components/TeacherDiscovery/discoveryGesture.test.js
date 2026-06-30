import { describe, it, expect } from 'vitest';
import {
  isHorizontalSwipe,
  decideSwipe,
  DEADZONE,
  SWIPE_RATIO,
  VELOCITY,
} from './discoveryGesture';

// These tests are the objective proof that the gesture math is correct — they
// stand in for the visual/gesture QA a terminal agent cannot perform.

describe('isHorizontalSwipe', () => {
  it('requires horizontal travel beyond the deadzone', () => {
    expect(isHorizontalSwipe(DEADZONE, 0)).toBe(false);      // exactly on the line → not yet
    expect(isHorizontalSwipe(DEADZONE + 1, 0)).toBe(true);   // just past → engages
    expect(isHorizontalSwipe(5, 0)).toBe(false);             // tiny nudge → no
  });

  it('requires horizontal to dominate vertical (1.2x)', () => {
    // 30px across but 30px down → vertical scroll, not a swipe
    expect(isHorizontalSwipe(30, 30)).toBe(false);
    // 30px across, only 10px down → clearly horizontal
    expect(isHorizontalSwipe(30, 10)).toBe(true);
    // mostly vertical → scroll
    expect(isHorizontalSwipe(20, 40)).toBe(false);
  });

  it('works symmetrically for left and right (sign-agnostic)', () => {
    expect(isHorizontalSwipe(-40, 10)).toBe(true);
    expect(isHorizontalSwipe(-5, 0)).toBe(false);
  });
});

describe('decideSwipe', () => {
  const W = 340; // representative card width

  it('returns null below both the ratio and the velocity threshold', () => {
    const slowShort = W * SWIPE_RATIO - 10; // under the distance threshold
    expect(decideSwipe(slowShort, 0, W)).toBeNull();
    expect(decideSwipe(-slowShort, 0.1, W)).toBeNull();
  });

  it('commits past the distance ratio regardless of velocity', () => {
    const farRight = W * SWIPE_RATIO + 10;
    expect(decideSwipe(farRight, 0, W)).toBe('book');
    expect(decideSwipe(-farRight, 0, W)).toBe('pass');
  });

  it('commits on a fast flick even when distance is short', () => {
    const shortDist = W * SWIPE_RATIO - 20; // below distance threshold
    expect(decideSwipe(shortDist, VELOCITY + 0.1, W)).toBe('book');
    expect(decideSwipe(-shortDist, -(VELOCITY + 0.1), W)).toBe('pass');
  });

  it('right = book, left = pass', () => {
    expect(decideSwipe(W, 0, W)).toBe('book');
    expect(decideSwipe(-W, 0, W)).toBe('pass');
  });

  it('honors a custom sensitivity ratio', () => {
    const offset = W * 0.3;
    // default ratio 0.32 → 0.30 is below threshold (null without a flick)
    expect(decideSwipe(offset, 0, W)).toBeNull();
    // looser ratio 0.25 → same offset now commits
    expect(decideSwipe(offset, 0, W, 0.25)).toBe('book');
  });
});
