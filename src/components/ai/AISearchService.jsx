
import { User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { searchTeachers } from '@/api/teacherSearchApi';
import { supabase } from '@/api/supabaseClient';

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

// Deterministic fallback parser: pulls a max price and a level out of the raw
// query so search works even when no LLM is wired. Always runs (Phase 2 upgrades
// this to catalog-driven subject/specialization/language parsing).
function parseQueryFilters(query) {
    const q = (query || '').toLowerCase();
    let maxPrice = null;
    const priceMatch =
        q.match(/(?:under|below|less than|up to|max(?:imum)?|<)\s*\$?\s*(\d{1,4})/) ||
        q.match(/\$\s*(\d{1,4})/);
    if (priceMatch) maxPrice = Number(priceMatch[1]);

    let level = null;
    for (const lvl of ['beginner', 'intermediate', 'advanced', 'expert']) {
        if (q.includes(lvl)) { level = lvl.charAt(0).toUpperCase() + lvl.slice(1); break; }
    }
    return { maxPrice, level };
}

// Best-effort structured extraction via the LLM integration. Returns null when
// the integration isn't wired (mock returns {ok:true}) or returns nothing
// usable, so the deterministic parser stays in charge. No paid AI today.
async function llmExtractFilters(query) {
    try {
        const r = await InvokeLLM({
            prompt: `Extract teacher-search filters from this student request and return JSON only. Request: "${query}"`,
            response_json_schema: {
                type: 'object',
                properties: {
                    subjects: { type: 'array', items: { type: 'string' } },
                    specializations: { type: 'array', items: { type: 'string' } },
                    languages: { type: 'array', items: { type: 'string' } },
                    level: { type: 'string' },
                    maxPrice: { type: 'number' },
                },
            },
        });
        if (r && typeof r === 'object' &&
            (r.subjects?.length || r.specializations?.length || r.languages?.length || r.level || typeof r.maxPrice === 'number')) {
            return r;
        }
    } catch {
        // integration not available — fall back to the deterministic parser
    }
    return null;
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
            // Never block search because the counter failed.
            return { canSearch: true, remaining: AI_SEARCH_DAILY_LIMIT, limit: AI_SEARCH_DAILY_LIMIT, unlimited: false };
        }
    },

    /**
     * Parses the natural-language query into filters (LLM when available, the
     * deterministic parser otherwise — which ALWAYS runs) and ranks verified
     * teachers via the SQL recommendation engine. $0 per query: no paid AI,
     * no external embedding API, no vector DB.
     * @param {string} query - The user's search query.
     * @returns {Promise<{success: boolean, results?: any[], error?: string}>}
     */
    performAISearch: async function (query) {
        const status = await this.getUserSearchStatus();
        if (!status.canSearch) {
            return { success: false, error: `You've reached today's search limit (${status.limit}). Please try again tomorrow.` };
        }

        try {
            const llm = await llmExtractFilters(query);   // null unless a real LLM is wired
            const parsed = parseQueryFilters(query);      // deterministic, always runs

            const results = await searchTeachers({
                query,
                subjects: llm?.subjects?.length ? llm.subjects : null,
                specializations: llm?.specializations?.length ? llm.specializations : null,
                languages: llm?.languages?.length ? llm.languages : null,
                level: llm?.level || parsed.level || null,
                maxPrice: typeof llm?.maxPrice === 'number' ? llm.maxPrice : parsed.maxPrice,
                limit: 24,
            });

            logSearch(query, results.length);
            return { success: true, results };
        } catch (error) {
            console.error('Smart Search error:', error);
            return { success: false, error: 'An unexpected error occurred during the search.' };
        }
    },
};

export default AISearchService;
