import { describe, it, expect } from 'vitest';
import { serializeFormState, hydrateFormState, fingerprint } from './serialize';

describe('serializeFormState', () => {
  it('strips the transient slot `error` but keeps start/end', () => {
    const snap = serializeFormState({
      availability: { slots: { Monday: [{ start: '09:00', end: '10:00', error: 'bad' }] } },
    });
    expect(snap.availability.slots.Monday[0]).toEqual({ start: '09:00', end: '10:00' });
  });

  it('drops a blob: object URL but keeps a real photo URL', () => {
    expect(serializeFormState({ personalInfo: { profilePicture: 'blob:abc' } }).personalInfo.profilePicture).toBe('');
    expect(serializeFormState({ personalInfo: { profilePicture: 'https://x/y.png' } }).personalInfo.profilePicture).toBe('https://x/y.png');
  });

  it('lowercases preferenceType', () => {
    const snap = serializeFormState({
      availability: { availabilityWindow: { preference: 2, preferenceType: 'Weeks' } },
    });
    expect(snap.availability.availabilityWindow.preferenceType).toBe('weeks');
  });

  it('never embeds files/base64 (only primitives/arrays/objects)', () => {
    const snap = serializeFormState({ personalInfo: { firstName: 'A' } });
    expect(JSON.stringify(snap)).not.toMatch(/^data:|base64/i);
  });
});

describe('hydrateFormState', () => {
  it('re-adds error:null and maps legacy {startHour,endHour} -> {start,end}', () => {
    const h = hydrateFormState({ availability: { slots: { Monday: [{ startHour: '09:00', endHour: '10:00' }] } } });
    expect(h.availability.slots.Monday[0]).toEqual({ start: '09:00', end: '10:00', error: null });
  });

  it('normalizes legacy capitalized preferenceType', () => {
    const h = hydrateFormState({ availability: { availabilityWindow: { preference: 3, preferenceType: 'Months' } } });
    expect(h.availability.availabilityWindow.preferenceType).toBe('months');
  });

  it('defaults window/advance when missing and tolerates null', () => {
    const h = hydrateFormState({});
    expect(h.availability.availabilityWindow).toEqual({ preference: 2, preferenceType: 'weeks' });
    expect(h.availability.farAdvanceBookingFromStudent).toEqual({ preference: 4, preferenceType: 'weeks' });
    expect(hydrateFormState(null)).toBeNull();
  });

  it('round-trips: serialize(hydrate(snap)) is identical (idempotent)', () => {
    const snap = serializeFormState({
      personalInfo: { firstName: 'A', profilePicture: 'https://x/y.png' },
      teachingSubjects: [{ subject: 'Math', level: 'Expert', id: '1', isCustom: false }],
      availability: {
        slots: { Monday: [{ start: '09:00', end: '10:00' }] },
        availabilityWindow: { preference: 2, preferenceType: 'weeks' },
        farAdvanceBookingFromStudent: { preference: 4, preferenceType: 'weeks' },
        breakAfterClassInHours: null,
      },
    });
    expect(fingerprint(serializeFormState(hydrateFormState(snap)))).toBe(fingerprint(snap));
  });
});

describe('fingerprint (change-detection)', () => {
  it('is stable across key order (so a no-op never re-saves)', () => {
    expect(fingerprint({ b: 1, a: 2 })).toBe(fingerprint({ a: 2, b: 1 }));
  });
  it('changes when content changes', () => {
    expect(fingerprint({ a: 1 })).not.toBe(fingerprint({ a: 2 }));
  });
});
