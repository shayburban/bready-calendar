import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap py-8">
            <Button 
                variant="ghost" 
                size="sm" 
                disabled={currentPage === 1}
                className="text-gray-400"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Input 
                type="number" 
                value={currentPage}
                className="w-16 h-8 text-center text-sm"
                placeholder="No."
            />
            
            {[2, 3, 4].map(page => (
                <Button key={page} variant="ghost" size="sm" className="w-8 h-8 text-sm">
                    {page}
                </Button>
            ))}
            
            <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-600 ml-2">Of {totalPages}</span>
        </div>
    );
}