import React from 'react';
import FilterSidebar from '../FilterSidebar';
import ActiveFilters from '../ActiveFilters';
import TeacherGrid from '../teacher-grid/TeacherGrid';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export default function TabletLayout({ teachers, loading, filters, handleFilterChange, handleRemoveFilter, handleClearAllFilters, isFilterOpen, setIsFilterOpen }) {
    return (
        <div className="flex gap-6">
            {isFilterOpen && (
                <div className="w-1/3">
                    <FilterSidebar
                        isOpen={true} // Always open in this layout when toggled
                        onClose={() => setIsFilterOpen(false)}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                    />
                </div>
            )}
            <div className="flex-1">
                 <Button onClick={() => setIsFilterOpen(!isFilterOpen)} variant="outline" className="mb-4">
                    {isFilterOpen ? <X className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
                    {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
                </Button>
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