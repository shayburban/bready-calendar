import React from 'react';
import TeacherCard from '../TeacherCard/TeacherCard';
import SortOptions from './SortOptions';

const ResultsGrid = ({ state, dispatch }) => {
    const { filteredResults, loading, error } = state;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading teachers...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">Error loading teachers: {error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="text-blue-600 hover:underline"
                >
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {filteredResults.length} {filteredResults.length === 1 ? 'Teacher' : 'Teachers'} Found
                </h2>
                <SortOptions state={state} dispatch={dispatch} />
            </div>

            {/* Results Grid */}
            {filteredResults.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-600 text-lg mb-4">No teachers found matching your criteria</p>
                    <p className="text-gray-500">Try adjusting your filters or search terms</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredResults.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResultsGrid;