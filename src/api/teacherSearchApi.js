// Teacher search / recommendation client. Thin wrapper over the search_teachers
// RPC (migration 0021) — the single place the AI search engine and the listing
// page call to get ranked teachers. Returns flat cards in the exact shape the
// listing's searchReducer expects; empty array on any failure.
import { supabase } from './supabaseClient';

function toCard(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name || '',
    profilePicture: row.profile_picture || '',
    subjects: Array.isArray(row.subjects) ? row.subjects : [],
    specializations: Array.isArray(row.specializations) ? row.specializations : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    // Detailed [{language, proficiency}] for display (real registration data,
    // teacher_profiles.languages). `languages` above stays string[] for filters.
    languageLevels: Array.isArray(row.language_levels) ? row.language_levels : [],
    availability: Array.isArray(row.availability) ? row.availability : [],
    hourlyRate: { regular: row.regular_rate != null ? Number(row.regular_rate) : 0 },
    rating: row.rating != null ? Number(row.rating) : 0,
    location: row.location || '',
    country: row.country || '',
    score: row.score != null ? Number(row.score) : 0,
  };
}

// The AI search engine's entry point: pass a raw NL `query` and/or structured
// filters; get back teachers ranked by the SQL engine. All args optional.
export async function searchTeachers({
  query = null,
  subjects = null,
  specializations = null,
  languages = null,
  level = null,
  maxPrice = null,
  country = null,
  limit = 24,
} = {}) {
  try {
    const { data, error } = await supabase.rpc('search_teachers', {
      p_query: query,
      p_subjects: subjects,
      p_specializations: specializations,
      p_languages: languages,
      p_level: level,
      p_max_price: maxPrice,
      p_country: country,
      p_limit: limit,
    });
    if (error) throw error;
    return (data || []).map(toCard);
  } catch (e) {
    console.warn('[teacherSearchApi] searchTeachers failed:', e?.message || e);
    return [];
  }
}

// Default listing: all verified teachers, best-rated first.
export async function listTeacherCards(limit = 60) {
  return searchTeachers({ limit });
}
