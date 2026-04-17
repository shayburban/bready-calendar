import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ subject }) => (
    <nav aria-label="breadcrumb" className="absolute bottom-4 left-4 hidden sm:block">
        <ol className="flex items-center space-x-2 text-white bg-black bg-opacity-30 px-4 py-2 rounded">
            <li>
                <Link to={createPageUrl('Home')} className="hover:underline">Home</Link>
            </li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="font-semibold" aria-current="page">Listing {subject} Expert</li>
        </ol>
    </nav>
);

export default function ListingBanner({ subject, tags }) {
    return (
        <div className="relative">
            <img 
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop" 
                alt="Science banner" 
                className="w-full h-64 md:h-80 object-cover" 
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="text-center text-white p-4 max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">
                        {subject} Teacher
                    </h1>
                    <div className="flex items-center justify-center flex-wrap gap-3 mt-4">
                        <p className="text-gray-200 text-lg">Popular Tags:</p>
                        {tags.map(tag => (
                            <Button 
                                key={tag} 
                                variant="outline" 
                                size="sm"
                                className="text-white border-white hover:bg-white hover:text-black transition-colors"
                                title="Add specification filter to search"
                            >
                                {tag}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <Breadcrumbs subject={subject} />
        </div>
    );
}