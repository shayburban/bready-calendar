import { describe, it, expect } from 'vitest';
import { rescheduleBlocks } from '@/lib/calendar/rescheduleBlocks';

describe('rescheduleBlocks', () => {
  it('falls back to the original placeholder copy for a bare demo event', () => {
    const { existing, proposed } = rescheduleBlocks({}, { counterpart: 'student' });
    expect(existing.name).toBe('Student N.');
    expect(existing.when).toContain('15:00 - 16:00');
    expect(existing.when).toContain('19.07.2021');
    expect(existing.price).toEqual({ amount: 30, detail: ' (10$ * 3 Hr = 30$ total price)' });
    // With no real payload the proposed side mirrors the placeholder too.
    expect(proposed.when).toContain('15:00 - 16:00');
  });

  it('uses the counterpart name (student on the T card, teacher on the S card)', () => {
    expect(rescheduleBlocks({ student: 'Dana K.' }, { counterpart: 'student' }).existing.name).toBe('Dana K.');
    expect(rescheduleBlocks({ teacher: 'Mr. Levi' }, { counterpart: 'teacher' }).existing.name).toBe('Mr. Levi');
    // Supabase-shaped fallbacks.
    expect(rescheduleBlocks({ student_name: 'Roni' }, { counterpart: 'student' }).existing.name).toBe('Roni');
    expect(rescheduleBlocks({ tutor_name: 'Avi' }, { counterpart: 'teacher' }).existing.name).toBe('Avi');
  });

  it('renders the explicit existing booking and the explicit proposed booking distinctly', () => {
    const event = {
      student: 'Student N.',
      existing: { time: '13:00 - 14:00', dateLabel: '22.04.2026', amount: 30, hourly_rate: 10, duration_hours: 3 },
      proposed: { time: '16:00 - 17:00', dateLabel: '25.04.2026', amount: 30, hourly_rate: 10, duration_hours: 3 },
    };
    const { existing, proposed } = rescheduleBlocks(event, { counterpart: 'student' });
    expect(existing.when).toBe('13:00 - 14:00  22.04.2026');
    expect(proposed.when).toBe('16:00 - 17:00  25.04.2026');
    expect(existing.price).toEqual({ amount: 30, detail: ' (10$ * 3 Hr = 30$ total price)' });
    expect(proposed.price).toEqual({ amount: 30, detail: ' (10$ * 3 Hr = 30$ total price)' });
  });

  it('falls back the proposed side to the event\'s own top-level slot when not given explicitly', () => {
    const event = { student: 'Student N.', time: '18:00 - 19:00', amount: 40, hourly_rate: 10, duration_hours: 4 };
    const { proposed } = rescheduleBlocks(event, { counterpart: 'student' });
    expect(proposed.when).toContain('18:00 - 19:00');
    expect(proposed.price).toEqual({ amount: 40, detail: ' (10$ * 4 Hr = 40$ total price)' });
  });

  it('omits the price line when an explicit source has no amount', () => {
    const event = { existing: { time: '09:00 - 10:00' } };
    const { existing } = rescheduleBlocks(event, { counterpart: 'student' });
    expect(existing.when).toBe('09:00 - 10:00');
    expect(existing.price).toBe(null);
  });
});
