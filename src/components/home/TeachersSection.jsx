import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TeacherCard from '../teachers/TeacherCard';
import TabSelector from '../common/TabSelector';

// Sample teacher data
const sampleTeachers = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        subjects: ["Chemistry", "Biology"],
        location: "New York, USA",
        experience: { online: 3, offline: 5, industry: 8 },
        rating: 4.9,
        languages: [
            { name: "English", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "Spanish", level: "Fluent", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 10, minimum: 25 },
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=150&h=150&fit=crop&crop=face",
        category: "all"
    },
    {
        id: 2,
        name: "Prof. Michael Chen",
        subjects: ["Programming", "Computer Science"],
        location: "San Francisco, USA",
        experience: { online: 2, offline: 7, industry: 12 },
        rating: 4.8,
        languages: [
            { name: "English", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "Mandarin", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 15, minimum: 40 },
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        category: "programming"
    },
    {
        id: 3,
        name: "Emma Rodriguez",
        subjects: ["English", "Literature"],
        location: "London, UK",
        experience: { online: 4, offline: 6, industry: 2 },
        rating: 4.7,
        languages: [
            { name: "English", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "French", level: "Fluent", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 8, minimum: 20 },
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        category: "english"
    },
    {
        id: 4,
        name: "Dr. Ahmed Hassan",
        subjects: ["Mathematics", "Physics"],
        location: "Dubai, UAE",
        experience: { online: 5, offline: 8, industry: 10 },
        rating: 4.9,
        languages: [
            { name: "Arabic", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "English", level: "Fluent", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 12, minimum: 35 },
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        category: "math"
    },
    {
        id: 5,
        name: "Lisa Wang",
        subjects: ["Art", "Design"],
        location: "Toronto, Canada",
        experience: { online: 3, offline: 6, industry: 4 },
        rating: 4.6,
        languages: [
            { name: "English", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "Chinese", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 18, minimum: 45 },
        profileImage: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face",
        category: "art"
    },
    {
        id: 6,
        name: "Carlos Rodriguez",
        subjects: ["Spanish", "Business"],
        location: "Barcelona, Spain",
        experience: { online: 4, offline: 7, industry: 6 },
        rating: 4.8,
        languages: [
            { name: "Spanish", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "English", level: "Advanced", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 14, minimum: 32 },
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        category: "business"
    },
    {
        id: 7,
        name: "Dr. Priya Sharma",
        subjects: ["Data Science", "AI"],
        location: "Mumbai, India",
        experience: { online: 6, offline: 4, industry: 12 },
        rating: 4.9,
        languages: [
            { name: "Hindi", level: "Native", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" },
            { name: "English", level: "Fluent", flag: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop" }
        ],
        hourlyRate: { trial: 20, minimum: 55 },
        profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
        category: "technology"
    }
];

const TeacherGrid = ({ category }) => {
    const filteredTeachers = category === 'all' 
        ? sampleTeachers 
        : sampleTeachers.filter(teacher => teacher.category === category || teacher.category === 'all');

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
        </div>
    );
};

// Define tab data for TabSelector - matching SubjectsSection structure
const tabsData = [
    { label: 'All', value: 'all' },
    { label: 'English', value: 'english' },
    { label: 'Programming', value: 'programming' },
    { label: 'Math', value: 'math' },
    { label: 'Art', value: 'art' },
    { label: 'Business', value: 'business' },
    { label: 'Technology', value: 'technology' }
];

export default function TeachersSection() {
    const [activeTab, setActiveTab] = useState('all');

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
    };

    return (
        <section className="py-16 bg-gray-100">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 text-center">
                        <span className="text-brand-blue">Our</span> Teachers
                    </h2>
                </div>

                {/* TabSelector Integration - Identical to SubjectsSection */}
                <div className="mb-8">
                    <TabSelector
                        tabs={tabsData}
                        moreLabel="+X More"
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                        maxVisibleTabs={4}
                        className="justify-center md:justify-start"
                    />
                </div>

                {/* Teacher Grid Display based on active tab */}
                <TeacherGrid category={activeTab} />

                <div className="text-center mt-8">
                    <Button asChild variant="outline" className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white">
                        <Link to={createPageUrl('FindTutors')}>View Full List</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}