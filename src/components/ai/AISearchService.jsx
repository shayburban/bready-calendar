
import { User } from '@/api/entities';
import { AISearchConfig } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { format, isToday } from 'date-fns';

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

            // --- Here you would call your AI vector search backend ---
            // For now, we simulate a call to an LLM to get mock teacher IDs
            const response = await InvokeLLM({
                prompt: `Based on the query "${query}", return a JSON object with a list of plausible teacher IDs. The key should be "teacher_ids" and the value an array of numbers. For example: {"teacher_ids": [1, 2, 3]}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        teacher_ids: {
                            type: "array",
                            items: { type: "number" }
                        }
                    }
                }
            });

            // In a real scenario, you would use these IDs to fetch full teacher profiles.
            // For this demo, we can just return the mock IDs or mock data.
            return { success: true, results: response.teacher_ids || [] };

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
