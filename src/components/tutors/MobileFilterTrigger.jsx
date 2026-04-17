import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

export default function MobileFilterTrigger({ onClick }) {
  // This component uses CSS `sticky` to attach itself below the header on scroll.
  // `top-16` matches the mobile header's height (`h-16`).
  // `z-40` is just below the header's `z-50`.
  // Negative margins and padding make the background stretch edge-to-edge.
  return (
    <div className="lg:hidden sticky top-16 bg-gray-100/95 backdrop-blur-sm py-3 z-40 mb-4 -mx-4 px-4">
       <Button 
            variant="outline" 
            onClick={onClick}
            className="w-full flex items-center justify-center gap-2"
        >
            <Filter className="h-4 w-4" />
            Show Filters
        </Button>
    </div>
  );
}