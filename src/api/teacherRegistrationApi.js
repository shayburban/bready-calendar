// Backend write surface for the teacher-registration wizard (stages 1–5c).
//
// All functions are best-effort: they return { ok, ... } and never throw, so
// the wizard keeps working (on localStorage / the base44 mock) when there is no
// real Supabase session or the tables aren't migrated yet. Owner-scoped RLS
// (migration 0019) ties every write to auth.uid(), so these succeed only for a
// genuinely signed-in user — exactly the teacher filling in the form.
import { supabase } from './supabaseClient';

// Resolve the authenticated user id (uuid) RLS will check against.
// Returns null when there's no Supabase session (dev mock / guest).
async function getAuthUserId() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Draft autosave — one row per user, keyed by user_id (unique).
// ---------------------------------------------------------------------------
export async function saveDraft(formData, currentStep, currentSubStep) {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'no-session' };
  try {
    const { error } = await supabase
      .from('teacher_registration_drafts')
      .upsert(
        {
          user_id: userId,
          form_data: formData,
          current_step: currentStep,
          current_sub_step: currentSubStep,
          updated_date: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.warn('[teacherRegistrationApi] saveDraft failed:', error?.message || error);
    return { ok: false, reason: error?.message || 'error' };
  }
}

export async function loadDraft() {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'no-session', data: null };
  try {
    const { data, error } = await supabase
      .from('teacher_registration_drafts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return { ok: true, data: data || null };
  } catch (error) {
    console.warn('[teacherRegistrationApi] loadDraft failed:', error?.message || error);
    return { ok: false, reason: error?.message || 'error', data: null };
  }
}

// ---------------------------------------------------------------------------
// Final submit — maps the wizard's camelCase profile object to the snake_case
// teacher_profiles columns (schema 0001 + 0002).
// ---------------------------------------------------------------------------
export async function submitTeacherProfile(profileData) {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'no-session', data: null };
  try {
    const row = {
      user_id: userId,
      personal_info: profileData.personalInfo || {},
      subjects: profileData.subjects || [],
      specializations: profileData.specializations || [],
      boards: profileData.boards || [],
      exams: profileData.exams || [],
      languages: profileData.languages || [],
      hourly_rate: profileData.hourly_rate || {},
      services: profileData.services || [],
      packages: profileData.packages || [],
      experience: profileData.experience || {},
      education: profileData.education || [],
      certifications: profileData.certifications || [],
      availability_schedule: profileData.availability_schedule || {},
      availability_window: profileData.availability_window || null,
      advance_booking_policy: profileData.advance_booking_policy || null,
      break_after_class_hours:
        typeof profileData.break_after_class_hours === 'number'
          ? profileData.break_after_class_hours
          : (profileData.break_after_class_hours?.preference ?? null),
      verification_status: 'pending',
      status: 'active',
      search_keywords: profileData.search_keywords || [],
      // Stash fields without a dedicated column so nothing is lost.
      search_metadata: {
        ...(profileData.searchMetadata || {}),
        workHistory: profileData.workHistory || [],
        teachingHistory: profileData.teachingHistory || [],
      },
    };

    const { data, error } = await supabase
      .from('teacher_profiles')
      .insert(row)
      .select()
      .single();
    if (error) throw error;

    // Mark the draft submitted (best-effort; ignore failures).
    supabase
      .from('teacher_registration_drafts')
      .update({ submitted: true, updated_date: new Date().toISOString() })
      .eq('user_id', userId)
      .then(() => {}, () => {});

    return { ok: true, data };
  } catch (error) {
    console.warn('[teacherRegistrationApi] submitTeacherProfile failed:', error?.message || error);
    return { ok: false, reason: error?.message || 'error', data: null };
  }
}

// ---------------------------------------------------------------------------
// Custom catalog submission — writes to pending_data for admin approval.
// `context` has no column; it is folded into the jsonb additional_info so the
// approve_pending_data RPC (migration 0004) can spread it onto the profile.
// ---------------------------------------------------------------------------
export async function submitCustomData(dataType, dataValue, additionalInfo = {}, relatedSubject = null, context = {}) {
  const userId = await getAuthUserId();
  if (!userId) return { ok: false, reason: 'no-session', data: null };
  try {
    const { data, error } = await supabase
      .from('pending_data')
      .insert({
        teacher_id: userId,
        data_type: dataType,
        data_value: dataValue,
        related_subject: relatedSubject,
        additional_info: { ...additionalInfo, context },
        status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return { ok: true, data };
  } catch (error) {
    console.warn('[teacherRegistrationApi] submitCustomData failed:', error?.message || error);
    return { ok: false, reason: error?.message || 'error', data: null };
  }
}
