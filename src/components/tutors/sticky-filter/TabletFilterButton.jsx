
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Sliders } from 'lucide-react';

export default function TabletFilterButton({ onFilterToggle, isFilterOpen, activeFiltersCount = 0 }) {
  return (
    <div className="sticky top-20 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 mb-6">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Filter Teachers</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          
          <Button 
            variant={isFilterOpen ? "default" : "outline"}
            onClick={onFilterToggle}
            className="flex items-center gap-2 px-4 py-2 h-10"
          >
            {isFilterOpen ? (
              <>
                <X className="h-4 w-4" />
                Hide
              </>
            ) : (
              <>
                <Sliders className="h-4 w-4" />
                Filters
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
