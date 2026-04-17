import React from 'react';
import FilterSidebar from '../FilterSidebar';
import ActiveFilters from '../ActiveFilters';
import TeacherGrid from '../teacher-grid/TeacherGrid';

export default function DesktopLayout({ teachers, loading, filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters }) {
    return (
        <div className="flex gap-8">
            <div className="w-80">
                <FilterSidebar
                    isOpen={true} // Sidebar is always visible on desktop
                    onClose={() => {}} // No-op on desktop
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </div>
            <div className="flex-1">
                <ActiveFilters
                    filters={filters}
                    onRemove={handleRemoveFilter}
                    onClearAll={handleClearAllFilters}
                />
                <TeacherGrid teachers={teachers} loading={loading} />
            </div>
        </div>
    );
}