import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DesktopFilterToggle({ onFilterToggle, isFilterOpen, activeFiltersCount = 0 }) {
  return (
    <div className="mb-6 py-4 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-800">Find Teachers</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="px-2 py-1">
              {activeFiltersCount} filters applied
            </Badge>
          )}
        </div>
        
        <Button 
          variant="ghost"
          onClick={onFilterToggle}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          {isFilterOpen ? (
            <>
              <ChevronLeft className="h-4 w-4" />
              Hide Filters
            </>
          ) : (
            <>
              <Sliders className="h-4 w-4" />
              Show Filters
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}