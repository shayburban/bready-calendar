import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedSearchPanel from '../../ai/EnhancedSearchPanel';

export default function SearchInput({ onSearch }) {
    const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);

    const handleSearchResults = (searchParams) => {
        // Pass search results to parent component if onSearch is provided
        if (onSearch) {
            onSearch(searchParams);
        }
        
        // For demonstration, you can also trigger page-level search updates here
        // This might involve updating URL params or triggering global state changes
        console.log('Search results:', searchParams);
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchPanelOpen(true)}
                className="text-gray-600 hover:text-brand-blue transition-colors duration-150"
                aria-label="Open search panel"
            >
                <Search className="h-5 w-5" />
            </Button>

            <EnhancedSearchPanel
                isOpen={isSearchPanelOpen}
                onClose={() => setIsSearchPanelOpen(false)}
                onSearch={handleSearchResults}
            />
        </>
    );
}