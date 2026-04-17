import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Zap, SlidersHorizontal } from 'lucide-react';
import AISearchService from './AISearchService';
import { useToast } from "@/components/ui/use-toast"

const SearchInterface = ({ onSearch }) => {
    const [searchMode, setSearchMode] = useState('filter'); // 'filter' or 'ai'
    const [searchQuery, setSearchQuery] = useState('');
    const [aiSearchStatus, setAiSearchStatus] = useState({ remaining: 0, limit: 5 });
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const fetchSearchStatus = useCallback(async () => {
        const status = await AISearchService.getUserSearchStatus();
        setAiSearchStatus(status);
    }, []);

    useEffect(() => {
        if (searchMode === 'ai') {
            fetchSearchStatus();
        }
    }, [searchMode, fetchSearchStatus]);

    const handleSearch = async () => {
        if (searchMode === 'ai') {
            if (!searchQuery) {
                toast({ title: "Please enter a search query.", variant: "destructive" });
                return;
            }
            setIsLoading(true);
            const response = await AISearchService.performAISearch(searchQuery);
            if (response.success) {
                toast({ title: "AI search successful!", description: `Found ${response.results.length} potential matches.` });
                onSearch({ type: 'ai', results: response.results });
                fetchSearchStatus(); // Refresh count
            } else {
                toast({ title: "AI Search Failed", description: response.error, variant: "destructive" });
            }
            setIsLoading(false);
        } else {
            // For filter search, the parent component handles it via its own state
            onSearch({ type: 'filter', query: searchQuery });
        }
    };

    const SearchModeToggle = () => (
        <div className="flex items-center bg-gray-100 rounded-full p-1">
            <button 
                onClick={() => setSearchMode('filter')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${searchMode === 'filter' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                <SlidersHorizontal size={16} /> Filter Search
            </button>
            <button
                onClick={() => setSearchMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${searchMode === 'ai' ? 'bg-white text-gray-800 shadow' : 'text-gray-500 hover:bg-gray-200'}`}
            >
                <Zap size={16} /> AI Search
            </button>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <SearchModeToggle />
                <div className="w-full md:w-auto text-center md:text-right">
                    {searchMode === 'ai' && (
                        <p className="text-sm text-gray-500">
                            Daily AI Searches Remaining: <span className="font-semibold text-brand-blue">{aiSearchStatus.remaining}/{aiSearchStatus.limit}</span>
                        </p>
                    )}
                </div>
            </div>
            
            <div className="mt-4 flex gap-2">
                <Input 
                    type="text" 
                    placeholder={searchMode === 'ai' ? "Describe the teacher you're looking for..." : "Search by keyword (e.g., 'chemistry', 'Mark R.')"}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-grow"
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                    {isLoading ? 'Searching...' : <Search size={20} />}
                </Button>
            </div>
        </div>
    );
};

export default SearchInterface;