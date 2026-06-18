// Live catalog loader for the teacher-registration wizard.
//
// Reads the catalog tables seeded in migrations 0019/0020 and maps each row
// back into the exact shapes ServiceContext historically exposed from its
// hard-coded `mockData`, so every selector (Subject/Specialization/Board/
// Exam/Language) keeps working unchanged:
//   subjectCategories: [{ id, name }]
//   subjects:          [{ id, subName, category, categoryId }]
//   specializations:   [{ id, spec, subject }]
//   boards:            [{ id, board }]
//   exams:             [{ id, exam }]
//   languages:         [ 'English', ... ]   (array of strings)
//
// On ANY failure (offline, RLS, tables not migrated yet) it returns null and
// the caller falls back to the static catalog — the page never breaks.
import { supabase } from './supabaseClient';

export async function fetchRegistrationCatalog() {
  try {
    const [
      categoriesRes,
      subjectsRes,
      specsRes,
      boardsRes,
      examsRes,
      languagesRes,
    ] = await Promise.all([
      supabase.from('subject_categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('subjects').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('specializations').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('boards').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('exams').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('languages').select('*').eq('is_active', true).order('sort_order'),
    ]);

    const firstError =
      categoriesRes.error || subjectsRes.error || specsRes.error ||
      boardsRes.error || examsRes.error || languagesRes.error;
    if (firstError) throw firstError;

    // A migrated-but-empty DB is treated as "no catalog" → static fallback.
    if (!subjectsRes.data || subjectsRes.data.length === 0) return null;

    const categories = categoriesRes.data || [];
    const categoryNameBySlug = Object.fromEntries(
      categories.map((c) => [c.slug, c.name])
    );

    return {
      subjectCategories: categories.map((c) => ({ id: c.slug, name: c.name })),
      subjects: subjectsRes.data.map((s) => ({
        id: s.id,
        subName: s.name,
        category: categoryNameBySlug[s.category_slug] || '',
        categoryId: s.category_slug || '',
      })),
      specializations: specsRes.data.map((sp) => ({
        id: sp.id,
        spec: sp.name,
        subject: sp.subject_name,
      })),
      boards: (boardsRes.data || []).map((b) => ({
        id: b.id,
        board: b.name,
      })),
      exams: (examsRes.data || []).map((e) => ({
        id: e.id,
        exam: e.name,
      })),
      languages: (languagesRes.data || []).map((l) => l.name),
    };
  } catch (error) {
    console.warn('[registrationCatalog] live fetch failed, using static fallback:', error?.message || error);
    return null;
  }
}
