
import React from 'react';
import MobileLayout from './MobileLayout';
import TabletLayout from './TabletLayout';
import DesktopLayout from './DesktopLayout';

// This component was previously swapping between Mobile, Tablet, and Desktop layouts,
// causing the entire component tree to unmount and remount on screen resize,
// which resulted in a complete loss of state for filters, pagination, etc.
//
// The fix is to render all three layouts simultaneously and use responsive
// CSS classes (e.g., `md:hidden`, `lg:block`) to control their visibility.
// This ensures the components remain mounted in the DOM, preserving their state
// when the screen size changes.

export default function TeacherListingLayout(props) {
  // The useWindowWidth hook and conditional logic have been removed.
  // All props are now passed directly to each layout component.
  return (
    <>
      {/* Mobile Layout: Visible only on screens smaller than 'md' (e.g., typical mobile view) */}
      <div className="block md:hidden">
        <MobileLayout {...props} />
      </div>
      {/* Tablet Layout: Hidden on screens smaller than 'md' and larger than or equal to 'lg' 
          (e.g., typical tablet view between mobile and desktop) */}
      <div className="hidden md:block lg:hidden">
        <TabletLayout {...props} />
      </div>
      {/* Desktop Layout: Hidden on screens smaller than 'lg' (e.g., typical desktop view) */}
      <div className="hidden lg:block">
        <DesktopLayout {...props} />
      </div>
    </>
  );
}
