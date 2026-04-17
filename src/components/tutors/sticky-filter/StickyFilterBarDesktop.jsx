import React from 'react';

const StickyFilterBarDesktop = ({ onFilterToggle, isFilterOpen }) => {
  return (
    <div
      className="hidden md:block sticky top-16 z-30 bg-white shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Filter Teachers</h3>
          </div>
          <button 
            onClick={onFilterToggle}
            className="justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground flex items-center gap-2 px-4 py-2 h-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-sliders-vertical h-4 w-4"
            >
              <line x1="4" x2="4" y1="21" y2="14" />
              <line x1="4" x2="4" y1="10" y2="3" />
              <line x1="12" x2="12" y1="21" y2="12" />
              <line x1="12" x2="12" y1="8" y2="3" />
              <line x1="20" x2="20" y1="21" y2="16" />
              <line x1="20" x2="20" y1="12" y2="3" />
              <line x1="2" x2="6" y1="14" y2="14" />
              <line x1="10" x2="14" y1="8" y2="8" />
              <line x1="18" x2="22" y1="16" y2="16" />
            </svg>
            Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyFilterBarDesktop;