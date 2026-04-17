
import React from 'react';
import SearchContainer from '@/components/TeacherSearch/SearchContainer';
import ListingBanner from '@/components/tutors/ListingBanner';

// In a real app, you would fetch this data from your API
const MOCK_TEACHERS = [
    { id: 1, name: "Mark R.", subjects: ["Chemistry", "Biology"], specializations: ["Organic Chemistry"], hourlyRate: { regular: 50 }, rating: 5, location: "New York, USA", languages: ["English"], availability: ["Monday", "Wednesday", "Friday"] },
    { id: 2, name: "Dr. Sarah Johnson", subjects: ["Biology"], specializations: ["Microbiology", "Genetics"], hourlyRate: { regular: 60 }, rating: 4.8, location: "London, UK", languages: ["English"], availability: ["Tuesday", "Thursday"] },
    { id: 3, name: "Prof. David Lee", subjects: ["Physics"], specializations: ["Quantum Physics"], hourlyRate: { regular: 75 }, rating: 4.9, location: "Berlin, Germany", languages: ["German", "English"], availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { id: 4, name: "Maria Sanchez", subjects: ["Mathematics"], specializations: ["Calculus", "Algebra"], hourlyRate: { regular: 45 }, rating: 4.7, location: "Madrid, Spain", languages: ["Spanish", "English"], availability: ["Saturday", "Sunday"] },
    { id: 5, name: "John Doe", subjects: ["Chemistry"], specializations: ["General Chemistry"], hourlyRate: { regular: 30 }, rating: 4.5, location: "New York, USA", languages: ["English"], availability: ["Wednesday", "Friday"] },
];

export default function FindTutors() {
    return (
        <div className="bg-gray-50 min-h-screen">
            <ListingBanner
                subject="All Subjects"
                tags={["Find your perfect match", "Expert Tutors", "Flexible Scheduling"]}
            />
            <div className="container mx-auto px-4 py-8">
                <SearchContainer initialTeachers={MOCK_TEACHERS} />
            </div>
        </div>
    );
}
