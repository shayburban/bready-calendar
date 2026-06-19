// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLocalStorageAdapter, loadInitialDraft } from './storageAdapters';

describe('localStorage adapter', () => {
  beforeEach(() => { localStorage.clear(); });

  it('round-trips snapshot + step/sub-step', async () => {
    const a = createLocalStorageAdapter();
    await a.save({ x: 1 }, { currentStep: 2, currentSubStep: 3 });
    const loaded = await a.load();
    expect(loaded.snapshot).toEqual({ x: 1 });
    expect(loaded.currentStep).toBe(2);
    expect(loaded.currentSubStep).toBe(3);
  });

  it('degrades to in-memory + warns when localStorage quota is exceeded', async () => {
    const onQuotaWarning = vi.fn();
    const a = createLocalStorageAdapter({ onQuotaWarning });
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const res = await a.save({ y: 2 }, { currentStep: 1, currentSubStep: 1 });
    expect(res.degraded).toBe(true);
    expect(onQuotaWarning).toHaveBeenCalled();
    spy.mockRestore();
    const loaded = await a.load(); // served from the in-memory fallback
    expect(loaded.snapshot).toEqual({ y: 2 });
  });
});

describe('loadInitialDraft conflict resolution', () => {
  const fakeLocal = (snapshot, step = 1, sub = 1) => ({
    load: async () => ({ snapshot, currentStep: step, currentSubStep: sub }),
  });
  const fakeRemote = (row) => ({ load: async () => ({ ok: !!row, data: row }) });

  it('prefers remote (cross-device truth) and flags a divergence', async () => {
    const res = await loadInitialDraft(
      fakeLocal({ a: 1 }, 2, 1),
      fakeRemote({ form_data: { a: 2 }, current_step: 3, current_sub_step: 1, version: 5, updated_date: '2026-01-02' })
    );
    expect(res.source).toBe('remote');
    expect(res.snapshot).toEqual({ a: 2 });
    expect(res.version).toBe(5);
    expect(res.hasConflict).toBe(true);
  });

  it('does not flag a conflict when local and remote match', async () => {
    const res = await loadInitialDraft(
      fakeLocal({ a: 2 }),
      fakeRemote({ form_data: { a: 2 }, version: 1 })
    );
    expect(res.source).toBe('remote');
    expect(res.hasConflict).toBe(false);
  });

  it('skips a submitted remote draft', async () => {
    const res = await loadInitialDraft(fakeLocal({ a: 1 }), fakeRemote({ submitted: true, version: 9 }));
    expect(res.source).toBe('submitted');
    expect(res.snapshot).toBeNull();
  });

  it('falls back to local when there is no remote', async () => {
    const res = await loadInitialDraft(fakeLocal({ a: 1 }, 2, 2), fakeRemote(null));
    expect(res.source).toBe('local');
    expect(res.snapshot).toEqual({ a: 1 });
    expect(res.currentStep).toBe(2);
  });

  it('returns an empty start when neither tier has data', async () => {
    const res = await loadInitialDraft(fakeLocal(null), fakeRemote(null));
    expect(res.source).toBe('none');
    expect(res.snapshot).toBeNull();
  });
});
