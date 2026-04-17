import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export default function StickyFilterButton({ onClick, isVisible = true }) {
  if (!isVisible) return null;

  return (
    <div className="lg:hidden sticky top-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 z-40 mb-4">
      <div className="container mx-auto px-4">
        <Button 
          variant="outline" 
          onClick={onClick}
          className="w-full flex items-center justify-center gap-2 shadow-sm"
        >
          <Filter className="h-4 w-4" />
          Show Filters
        </Button>
      </div>
    </div>
  );
}