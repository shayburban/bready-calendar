
import { User } from '@/api/entities';
import { AISearchConfig } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { searchTeachers } from '@/api/teacherSearchApi';
import { format, isToday } from 'date-fns';

// Deterministic fallback parser: pulls a max price and a level out of the raw
// query so search works even when no LLM is wired (subject/specialization/
// language matching is handled by the RPC's full-text rank on the query).
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
// the integration isn't wired (mock) or returns nothing usable.
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

const AISearchService = {
    /**
     * Checks the user's current AI search status, resetting daily counts if necessary.
     * @returns {Promise<{canSearch: boolean, remaining: number, limit: number, error?: string}>}
     */
    async getUserSearchStatus() {
        try {
            const user = await User.me();
            let { ai_searches_today, ai_search_limit, last_search_date } = user;

            // Fetch default limit from admin config if user has no specific limit
            if (ai_search_limit === null || ai_search_limit === undefined) {
                const config = await AISearchConfig.list();
                ai_search_limit = config.length > 0 ? config[0].max_ai_searches_per_day : 5; // Default fallback
            }

            // Reset daily count if the last search was not today
            if (last_search_date && !isToday(new Date(last_search_date))) {
                ai_searches_today = 0;
                await User.updateMyUserData({ ai_searches_today: 0 });
            }

            const remaining = ai_search_limit - ai_searches_today;
            const canSearch = remaining > 0;

            return { canSearch, remaining, limit: ai_search_limit };

        } catch (e) {
            // User not logged in, treat as no searches available.
            return { canSearch: false, remaining: 0, limit: 0, error: "You must be logged in to use AI Search." };
        }
    },

    /**
     * Performs an AI search if the user has remaining searches.
     * @param {string} query - The user's search query.
     * @returns {Promise<{success: boolean, results?: any[], error?: string}>}
     */
    performAISearch: async function(query) {
        const status = await this.getUserSearchStatus();

        if (!status.canSearch) {
            return { success: false, error: status.error || "You have reached your daily AI search limit." };
        }

        try {
            // Decrement search count and update date
            const user = await User.me();
            const newCount = (user.ai_searches_today || 0) + 1;
            const today = format(new Date(), 'yyyy-MM-dd');
            await User.updateMyUserData({ 
                ai_searches_today: newCount,
                last_search_date: today
            });

            // Turn the natural-language query into structured filters (LLM when
            // available, deterministic parser otherwise), then let the SQL
            // recommendation engine rank verified teachers built from their
            // registration data. No vector DB / embedding key required.
            const llm = await llmExtractFilters(query);
            const parsed = parseQueryFilters(query);

            const results = await searchTeachers({
                query,
                subjects: llm?.subjects?.length ? llm.subjects : null,
                specializations: llm?.specializations?.length ? llm.specializations : null,
                languages: llm?.languages?.length ? llm.languages : null,
                level: llm?.level || parsed.level || null,
                maxPrice: typeof llm?.maxPrice === 'number' ? llm.maxPrice : parsed.maxPrice,
                limit: 24,
            });

            return { success: true, results };

        } catch (error) {
            console.error("AI Search Error:", error);
            // Revert search count if API call fails
            const user = await User.me();
            if (user && user.ai_searches_today > 0) {
                 await User.updateMyUserData({ ai_searches_today: user.ai_searches_today - 1 });
            }
            return { success: false, error: "An unexpected error occurred during the AI search." };
        }
    }
};

export default AISearchService;
