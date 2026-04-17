
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function HeaderSearch({ isMobile = false, value, onChange }) {
    const [internal, setInternal] = React.useState('');
    const searchTerm = value !== undefined ? value : internal;
    const setSearchTerm = onChange || setInternal;

    const handleSearch = (e) => {
        e.preventDefault();
        // Handle search logic here
        console.log('Searching for:', searchTerm);
    };

    if (isMobile) {
        return (
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-md">
                <div className="relative flex-1">
                    <Input
                        type="text"
                        placeholder="Search for tutors, subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-0"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 bg-brand-blue hover:bg-brand-blue-dark"
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative">
                <Input
                    type="text"
                    placeholder="Search for tutors, subjects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pr-10"
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 bg-brand-blue hover:bg-brand-blue-dark"
                >
                    <Search className="h-4 w-4" />
                </Button>
            </div>
        </form>
    );
}
