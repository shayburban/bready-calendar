import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export default function MobileFilterButton({ onFilterToggle, isFilterOpen }) {
  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-2 mb-4">
      <div className="container mx-auto px-4">
        <Button 
          variant={isFilterOpen ? "default" : "outline"}
          onClick={onFilterToggle}
          className="w-full flex items-center justify-center gap-2 h-10 text-sm font-medium shadow-sm"
        >
          {isFilterOpen ? (
            <>
              <X className="h-4 w-4" />
              Hide Filters
            </>
          ) : (
            <>
              <Filter className="h-4 w-4" />
              Show Filters
            </>
          )}
        </Button>
      </div>
    </div>
  );
}