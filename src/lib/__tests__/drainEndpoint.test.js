import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the drain core so we test only the endpoint's auth + trigger-agnostic wiring.
vi.mock('../../../lib-server/drain.js', () => ({
  runDrain: vi.fn(async () => ({ claimed: 0, succeeded: 0, failed: 0, deadLettered: 0, durationMs: 1 })),
}));

import handler from '../../../api/cron/drain-calendar-outbox.js';
import { runDrain } from '../../../lib-server/drain.js';

const call = (method, headers = {}) =>
  handler.fetch(new Request('https://x/api/cron/drain-calendar-outbox', { method, headers }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = 'testsecret';
});

describe('drain endpoint — auth', () => {
  it('rejects with 401 when no bearer is present (and never drains)', async () => {
    const res = await call('POST');
    expect(res.status).toBe(401);
    expect(runDrain).not.toHaveBeenCalled();
  });

  it('rejects with 401 on a wrong bearer', async () => {
    const res = await call('POST', { authorization: 'Bearer wrong' });
    expect(res.status).toBe(401);
    expect(runDrain).not.toHaveBeenCalled();
  });

  it('rejects unsupported methods with 405', async () => {
    const res = await call('PUT', { authorization: 'Bearer testsecret' });
    expect(res.status).toBe(405);
    expect(runDrain).not.toHaveBeenCalled();
  });
});

describe('drain endpoint — trigger-agnostic (BOTH GET and POST)', () => {
  it('GET (native Vercel cron) drains with source=native', async () => {
    const res = await call('GET', { authorization: 'Bearer testsecret' });
    expect(res.status).toBe(200);
    expect(runDrain).toHaveBeenCalledWith({ source: 'native' });
  });

  it('POST (external pg_cron / manual) drains with source=external', async () => {
    const res = await call('POST', { authorization: 'Bearer testsecret' });
    expect(res.status).toBe(200);
    expect(runDrain).toHaveBeenCalledWith({ source: 'external' });
  });
});
