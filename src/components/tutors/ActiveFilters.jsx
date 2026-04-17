import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const FilterBadge = ({ children, onRemove }) => (
    <Badge variant="secondary" className="flex items-center gap-1.5 pr-1.5">
        {children}
        <button onClick={onRemove} className="rounded-full hover:bg-gray-300 p-0.5">
            <X className="h-3 w-3" />
        </button>
    </Badge>
);

export default function ActiveFilters({ filters = {}, onRemove = () => {}, onClearAll = () => {} }) {
    const activeFilterEntries = Object.entries(filters).filter(([key, value]) => {
        if (Array.isArray(value)) {
            return value.length > 0;
        }
        return value !== null && value !== undefined && value !== '';
    });

    if (activeFilterEntries.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white rounded-lg border">
            <span className="text-sm font-semibold">Active Filters:</span>
            {activeFilterEntries.map(([type, values]) => {
                if (type === 'hourlyRate' && Array.isArray(values)) {
                    return <FilterBadge key={type} onRemove={() => onRemove(type, null)}>${values[0]}-${values[1]}</FilterBadge>
                }
                if (type === 'rating') {
                     return <FilterBadge key={type} onRemove={() => onRemove(type, null)}>{values} Star & Up</FilterBadge>
                }
                if (Array.isArray(values)) {
                    return values.map(value => (
                        <FilterBadge key={`${type}-${value}`} onRemove={() => onRemove(type, value)}>{value}</FilterBadge>
                    ));
                }
                return <FilterBadge key={type} onRemove={() => onRemove(type, null)}>{values}</FilterBadge>;
            })}
            <Button variant="link" onClick={onClearAll} className="text-blue-600 hover:text-blue-800 text-sm p-0 h-auto">
                Clear All
            </Button>
        </div>
    );
}