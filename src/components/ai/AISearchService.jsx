
import { User } from '@/api/entities';
import { searchTeachers, listTeacherCards } from '@/api/teacherSearchApi';
import { supabase } from '@/api/supabaseClient';
import { fetchRegistrationCatalog } from '@/api/registrationCatalog';
import { parseSearchQuery } from '@/lib/search/queryParser';

// ---------------------------------------------------------------------------
// Daily search cap.
//
// Phase 1: search is FREE — the cap is DISABLED by default (null = unlimited),
// so a real LLM bill never blocks a user and the old NaN-limit bug is gone.
// It stays trivially re-enableable: set a number here and the limiter counts
// the user's rows in teacher_search_logs over the last 24h.
// NOTE: teacher_search_logs currently has RLS enabled with no policies, so the
// fire-and-forget write below is best-effort (silently denied until an
// INSERT/SELECT policy is added). Re-enabling the live cap therefore means:
// (1) set a number here, and (2) add those RLS policies in a migration.
// ---------------------------------------------------------------------------
const AI_SEARCH_DAILY_LIMIT = null; // e.g. 50 to re-enable a soft cap
const DAY_MS = 24 * 60 * 60 * 1000;

// Catalog is the parser's authoritative backbone. Loaded once, cached; falls
// back to the parser's built-in DEFAULT_CATALOG when the live fetch returns null
// (offline / RLS / not migrated). $0 — a single cached read, no AI.
let _catalogPromise = null;
function getCatalog() {
    if (!_catalogPromise) {
        _catalogPromise = fetchRegistrationCatalog().catch(() => null);
    }
    return _catalogPromise;
}

// Fire-and-forget usage log. Powers analytics + the optional re-enableable 24h
// cap. Never blocks search and never surfaces errors (RLS may reject the write
// until a policy is added — that's fine, the cap is disabled by default).
function logSearch(query, resultsCount) {
    (async () => {
        try {
            const user = await User.me();
            if (!user?.id) return;
            await supabase.from('teacher_search_logs').insert({
                user_id: user.id,
                search_query: query,
                search_type: 'smart',
                results_count: resultsCount,
            });
        } catch {
            // best-effort only
        }
    })();
}

// Fallback ladder so the page is never a dead end. Hard price is preserved
// throughout; the least-critical filters are relaxed first. Each step records
// which filter was dropped so the UI can tell the user what happened.
async function runFallbackLadder(parsed) {
    const cap = parsed.price?.cap ?? null;
    const hardPrice = cap != null && !parsed.price.soft;
    const applyPrice = (rows) => (hardPrice ? rows.filter((r) => (r.hourlyRate?.regular ?? 0) <= cap) : rows);

    const base = {
        query: parsed.residualText || null,
        subjects: parsed.subjects.length ? parsed.subjects : null,
        specializations: parsed.specializations.length ? parsed.specializations : null,
        languages: parsed.languages.length ? parsed.languages : null,
        level: parsed.level || null,
        maxPrice: cap,
        limit: 24,
    };

    const relaxed = [];
    let rows = applyPrice(await searchTeachers(base));
    if (rows.length) return { results: rows, relaxed };

    // 1) relax language (least critical)
    if (base.languages) {
        base.languages = null; relaxed.push('language');
        rows = applyPrice(await searchTeachers(base));
        if (rows.length) return { results: rows, relaxed };
    }
    // 2) soften subject by dropping the (narrower) specialization
    if (base.specializations) {
        base.specializations = null; relaxed.push('specialization');
        rows = applyPrice(await searchTeachers(base));
        if (rows.length) return { results: rows, relaxed };
    }
    // 3) drop the subject filter, pushing its terms into the text query instead
    if (base.subjects) {
        base.query = [base.query, ...parsed.subjects, ...parsed.specializations].filter(Boolean).join(' ') || null;
        base.subjects = null; relaxed.push('subject');
        rows = applyPrice(await searchTeachers(base));
        if (rows.length) return { results: rows, relaxed };
    }
    // 4) floor: top verified teachers + "Did you mean…?"
    relaxed.push('all');
    const top = await listTeacherCards(24);
    return { results: top, relaxed, fellBackToTop: true };
}

const AISearchService = {
    /**
     * Reports whether the user may search and how many searches remain.
     * With the cap disabled (default) this is always unlimited and never blocks.
     * @returns {Promise<{canSearch: boolean, remaining: number|null, limit: number|null, unlimited: boolean}>}
     */
    async getUserSearchStatus() {
        if (AI_SEARCH_DAILY_LIMIT == null) {
            return { canSearch: true, remaining: null, limit: null, unlimited: true };
        }
        try {
            const user = await User.me();
            const since = new Date(Date.now() - DAY_MS).toISOString();
            const { count } = await supabase
                .from('teacher_search_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_date', since);
            const used = count || 0;
            const remaining = Math.max(0, AI_SEARCH_DAILY_LIMIT - used);
            return { canSearch: remaining > 0, remaining, limit: AI_SEARCH_DAILY_LIMIT, unlimited: false };
        } catch {
            return { canSearch: true, remaining: AI_SEARCH_DAILY_LIMIT, limit: AI_SEARCH_DAILY_LIMIT, unlimited: false };
        }
    },

    /**
     * Smart Search: parses the natural-language query into catalog-resolved
     * structured filters (subjects/specializations/languages/level/price) plus a
     * residual free-text blob, then ranks verified teachers via the SQL engine,
     * never letting price/filler words pollute full-text search. The fallback
     * ladder guarantees the page is never a dead end. $0 per query: no paid AI,
     * no external embedding API, no vector DB.
     * @param {string} query
     * @returns {Promise<{success: boolean, results?: any[], parsed?: object, summary?: string[], relaxed?: string[], suggestions?: string[], error?: string}>}
     */
    performAISearch: async function (query) {
        const status = await this.getUserSearchStatus();
        if (!status.canSearch) {
            return { success: false, error: `You've reached today's search limit (${status.limit}). Please try again tomorrow.` };
        }

        try {
            const catalog = await getCatalog();
            const parsed = parseSearchQuery(query, catalog);
            const { results, relaxed, fellBackToTop } = await runFallbackLadder(parsed);

            logSearch(query, results.length);
            return {
                success: true,
                results,
                parsed,
                summary: parsed.summaryChips,
                relaxed,
                fellBackToTop: !!fellBackToTop,
                suggestions: parsed.suggestions,
            };
        } catch (error) {
            console.error('Smart Search error:', error);
            return { success: false, error: 'An unexpected error occurred during the search.' };
        }
    },
};

export default AISearchService;
