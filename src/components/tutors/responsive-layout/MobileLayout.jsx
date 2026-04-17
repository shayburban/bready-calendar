import React from 'react';
import FilterSidebar from '../FilterSidebar';
import ActiveFilters from '../ActiveFilters';
import TeacherGrid from '../teacher-grid/TeacherGrid';
import MobileFilterTrigger from '../MobileFilterTrigger';

export default function MobileLayout({ teachers, loading, filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, isFilterOpen, setIsFilterOpen }) {
    return (
        <div>
            <MobileFilterTrigger onClick={() => setIsFilterOpen(true)} />

            {isFilterOpen ? (
                <FilterSidebar
                    isOpen={isFilterOpen}
                    onClose={() => setIsFilterOpen(false)}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            ) : (
                <>
                    <ActiveFilters
                        filters={filters}
                        onRemove={handleRemoveFilter}
                        onClearAll={handleClearAllFilters}
                    />
                    <TeacherGrid teachers={teachers} loading={loading} />
                </>
            )}
        </div>
    );
}