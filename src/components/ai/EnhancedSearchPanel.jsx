
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, X, Zap, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AISearchService from './AISearchService';
import { useToast } from "@/components/ui/use-toast";

const EnhancedSearchPanel = ({ isOpen, onClose, onSearch }) => {
    const [searchMode, setSearchMode] = useState('ai'); // Changed default to 'ai'
    const [searchQuery, setSearchQuery] = useState('');
    const [characterCount, setCharacterCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [aiSearchStatus, setAiSearchStatus] = useState({ remaining: 0, limit: 5 });
    const { toast } = useToast();
    const textareaRef = useRef(null);
    const panelRef = useRef(null);

    const MAX_CHARACTERS = 500;

    // Fetch AI search status when panel opens and mode is AI
    useEffect(() => {
        if (isOpen && searchMode === 'ai') {
            fetchSearchStatus();
        }
    }, [isOpen, searchMode]);

    // ESC key handler
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
            return () => document.removeEventListener('keydown', handleEscKey);
        }
    }, [isOpen, onClose]);

    // Auto-focus search input when panel opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current.focus();
            }, 300); // Delay to allow animation to complete
        }
    }, [isOpen]);

    const fetchSearchStatus = async () => {
        try {
            const status = await AISearchService.getUserSearchStatus();
            setAiSearchStatus(status);
        } catch (error) {
            console.error('Error fetching search status:', error);
        }
    };

    const handleSearchQueryChange = (e) => {
        const value = e.target.value;
        if (value.length <= MAX_CHARACTERS) {
            setSearchQuery(value);
            setCharacterCount(value.length);
            
            // Auto-resize textarea
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
            }
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast({ title: "Please enter a search query.", variant: "destructive" });
            return;
        }

        setIsLoading(true);

        if (searchMode === 'ai') {
            try {
                const response = await AISearchService.performAISearch(searchQuery);
                if (response.success) {
                    toast({ 
                        title: "AI search successful!", 
                        description: `Found ${response.results.length} potential matches.` 
                    });
                    onSearch({ type: 'ai', results: response.results, query: searchQuery });
                    await fetchSearchStatus(); // Refresh count
                    onClose(); // Close panel after successful search
                } else {
                    toast({ 
                        title: "AI Search Failed", 
                        description: response.error, 
                        variant: "destructive" 
                    });
                }
            } catch (error) {
                toast({ 
                    title: "Search Error", 
                    description: "An error occurred while searching.", 
                    variant: "destructive" 
                });
            }
        } else {
            // Filter search
            onSearch({ type: 'filter', query: searchQuery });
            onClose(); // Close panel after search
        }
        
        setIsLoading(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        }
    };

    const SearchModeToggle = () => (
        <div className="flex items-center justify-center bg-gray-100 rounded-full p-1 mb-4">
            <button 
                onClick={() => setSearchMode('filter')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                    searchMode === 'filter' 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                type="button"
                role="tab"
                aria-selected={searchMode === 'filter'}
                aria-controls="search-content"
            >
                <SlidersHorizontal size={16} /> Filter Search
            </button>
            <button
                onClick={() => setSearchMode('ai')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 cursor-pointer ${
                    searchMode === 'ai' 
                        ? 'bg-white text-gray-800 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                type="button"
                role="tab"
                aria-selected={searchMode === 'ai'}
                aria-controls="search-content"
            >
                <Zap size={16} /> AI Search
            </button>
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Background Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={onClose}
                    />

                    {/* Search Panel */}
                    <motion.div
                        ref={panelRef}
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="fixed top-0 left-0 right-0 bg-white shadow-xl z-50 border-b"
                    >
                        <div className="container mx-auto px-6 py-6 max-w-4xl">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Search for Tutors</h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 transition-colors duration-150"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Search Mode Toggle */}
                            <SearchModeToggle />

                            {/* AI Search Status */}
                            {searchMode === 'ai' && (
                                <div className="text-center mb-4">
                                    <p className="text-sm text-gray-600">
                                        Daily AI Searches Remaining: 
                                        <span className="font-semibold text-brand-blue ml-1">
                                            {aiSearchStatus.remaining}/{aiSearchStatus.limit}
                                        </span>
                                    </p>
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="space-y-3" id="search-content">
                                <div className="relative">
                                    <Textarea
                                        ref={textareaRef}
                                        placeholder={
                                            searchMode === 'ai' 
                                                ? "Describe the teacher you're looking for... (e.g., 'I need a chemistry tutor who specializes in organic chemistry and has experience with AP level courses')"
                                                : "Search by keyword (e.g., 'chemistry', 'Mark R.', 'organic chemistry')"
                                        }
                                        value={searchQuery}
                                        onChange={handleSearchQueryChange}
                                        onKeyPress={handleKeyPress}
                                        className="min-h-[60px] max-h-[200px] resize-none transition-all duration-200 text-base pr-12"
                                        style={{ height: 'auto' }}
                                    />
                                    
                                    {/* Character Counter */}
                                    <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                                        {characterCount}/{MAX_CHARACTERS}
                                    </div>
                                </div>

                                {/* Search Button */}
                                <div className="flex justify-center">
                                    <Button
                                        onClick={handleSearch}
                                        disabled={isLoading || !searchQuery.trim()}
                                        className="bg-brand-green hover:bg-brand-green-dark px-8 py-2 text-white font-medium transition-colors duration-150"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-2" />
                                                {searchMode === 'ai' ? 'Search with AI' : 'Search'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Help Text */}
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    {searchMode === 'ai' 
                                        ? "AI search uses natural language to find the best matching tutors based on your description."
                                        : "Use keywords to search through tutor names, subjects, and specializations."
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default EnhancedSearchPanel;
