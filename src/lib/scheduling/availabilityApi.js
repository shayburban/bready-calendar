// Availability persistence seam — wraps the set_availability_one_off RPC (0012).
// The teacher's painted wall-clock is converted to absolute-UTC rows
// (availabilityToRows + TimeKit) before calling, so only UTC instants cross the
// wire (R24, no viewerTz). SECURITY DEFINER writes through RLS; granted to
// authenticated. The RPC REPLACES the teacher's FUTURE one-off availability with
// the submitted set (the client holds the full set as the source of truth) and
// returns the inserted-row count.

import { supabase } from '@/api/supabaseClient';

// rows: [{ start_utc, end_utc }] — absolute-UTC ISO strings (from availabilityToRows).
export const setAvailabilityOneOff = async (teacherId, rows) => {
  const { data, error } = await supabase.rpc('set_availability_one_off', {
    p_teacher_id: teacherId,
    p_slots: rows,
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, count: data };
};
