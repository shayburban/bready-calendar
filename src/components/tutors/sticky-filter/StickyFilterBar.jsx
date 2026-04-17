import React from 'react';
import MobileFilterButton from './MobileFilterButton';
import TabletFilterButton from './TabletFilterButton';
import DesktopFilterToggle from './DesktopFilterToggle';

export default function StickyFilterBar({ onFilterToggle, isFilterOpen }) {
  return (
    <>
      {/* Mobile: Show sticky button below header */}
      <div className="block sm:hidden">
        <MobileFilterButton 
          onFilterToggle={onFilterToggle} 
          isFilterOpen={isFilterOpen} 
        />
      </div>

      {/* Tablet: Show sticky button with more space */}
      <div className="hidden sm:block lg:hidden">
        <TabletFilterButton 
          onFilterToggle={onFilterToggle} 
          isFilterOpen={isFilterOpen} 
        />
      </div>

      {/* Desktop: Show inline toggle (not sticky) */}
      <div className="hidden lg:block">
        <DesktopFilterToggle 
          onFilterToggle={onFilterToggle} 
          isFilterOpen={isFilterOpen} 
        />
      </div>
    </>
  );
}