
import React, { useEffect, useState } from 'react';
import SearchContainer from '@/components/TeacherSearch/SearchContainer';
import ListingBanner from '@/components/tutors/ListingBanner';
import TeacherDiscovery from '@/components/TeacherDiscovery/TeacherDiscovery';
import { listTeacherCards } from '@/api/teacherSearchApi';

// Fallback catalog shown until real verified teachers exist (or when offline).
const MOCK_TEACHERS = [
    // Mark R. is seeded to the registration-form shape so the v9 card renders
    // fully (specializations / experience / languages / services / cancellation).
    // `trialedServiceNames: ["Consulting"]` demos the "already trialed → show the
    // selected service instead of Trial Lesson" behavior. TODO: wire to live DB.
    {
        id: 1, name: "Mark R.", subjects: ["Chemistry", "Biology"], rating: 5, reviews: 10,
        tag: "Top Rated", location: "New York, USA",
        languages: ["English", "Italian", "German"],
        specializations: ["Organic Chemistry", "Bio Chemistry", "Analytical Chemistry", "Physical Chemistry", "Inorganic Chemistry", "Polymer Chemistry", "Medicinal Chemistry"],
        experience: { online_years: 1, offline_years: 3, industry_years: 3 },
        bio: "Patient chemistry tutor focused on building intuition, not memorization.",
        hourlyRate: { regular: 50, trial: 1 },
        services: [
            { name: "Online Class", price: 1, tone: "blue", enabled: true },
            { name: "Consulting", price: 5, tone: "blue", enabled: true },
            { name: "Worksheet Review", price: 7, tone: "green", enabled: true },
            { name: "Exam Prep", price: 8, tone: "blue", enabled: true },
            { name: "Lab Report Help", price: 6, tone: "blue", enabled: true },
            { name: "Group Session", price: 4, tone: "green", enabled: true },
        ],
        cancellation: { percentage: 30, freeCancellationDays: 10, freeCancellationHours: 3 },
        trialedServiceNames: ["Consulting"],
        availability: ["Monday", "Wednesday", "Friday"],
    },
    { id: 2, name: "Dr. Sarah Johnson", subjects: ["Biology"], specializations: ["Microbiology", "Genetics"], hourlyRate: { regular: 60 }, rating: 4.8, location: "London, UK", languages: ["English"], availability: ["Tuesday", "Thursday"] },
    { id: 3, name: "Prof. David Lee", subjects: ["Physics"], specializations: ["Quantum Physics"], hourlyRate: { regular: 75 }, rating: 4.9, location: "Berlin, Germany", languages: ["German", "English"], availability: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    { id: 4, name: "Maria Sanchez", subjects: ["Mathematics"], specializations: ["Calculus", "Algebra"], hourlyRate: { regular: 45 }, rating: 4.7, location: "Madrid, Spain", languages: ["Spanish", "English"], availability: ["Saturday", "Sunday"] },
    { id: 5, name: "John Doe", subjects: ["Chemistry"], specializations: ["General Chemistry"], hourlyRate: { regular: 30 }, rating: 4.5, location: "New York, USA", languages: ["English"], availability: ["Wednesday", "Friday"] },
];

export default function FindTutors() {
    // Load real verified teachers (built from registration data via the
    // search_teachers RPC). Falls back to MOCK_TEACHERS until any exist / offline.
    const [teachers, setTeachers] = useState(MOCK_TEACHERS);

    useEffect(() => {
        let cancelled = false;
        listTeacherCards(60)
            .then((cards) => {
                if (!cancelled && Array.isArray(cards) && cards.length > 0) {
                    setTeachers(cards);
                }
            })
            .catch(() => { /* keep the mock fallback */ });
        return () => { cancelled = true; };
    }, []);

    return (
        <>
            {/* PHONE (< md): Bumble-style swipe-to-book Teacher Discovery — a
                full-screen takeover mounted only on phones. */}
            <div className="md:hidden">
                <TeacherDiscovery teachers={teachers} />
            </div>

            {/* TABLET / DESKTOP (md+): the existing listing grid, untouched. */}
            <div className="hidden md:block bg-gray-50 min-h-screen">
                <ListingBanner
                    subject="All Subjects"
                    tags={["Find your perfect match", "Expert Tutors", "Flexible Scheduling"]}
                />
                <div className="container mx-auto px-4 py-8">
                    <SearchContainer initialTeachers={teachers} />
                </div>
            </div>
        </>
    );
}
