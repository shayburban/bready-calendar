import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, BadgeCheck } from 'lucide-react';
import TabSelector from '../common/TabSelector';

const sampleTeachers = [
    {
        id: 1,
        name: "Dr. Sarah Johnson",
        subjects: ["Chemistry", "Biology"],
        subtitle: "Physics & Advanced Calculus",
        location: "New York, USA",
        rating: 4.9,
        reviews: 128,
        bio: "PhD in Theoretical Physics from MIT. I specialize in making complex quantum concepts accessible to undergraduate students.",
        hourlyRate: 85,
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b1e5?w=400&h=400&fit=crop&crop=face",
        certified: true,
        category: "all"
    },
    {
        id: 2,
        name: "Prof. Michael Chen",
        subjects: ["Programming", "Computer Science"],
        subtitle: "Computer Science & Data Structures",
        location: "San Francisco, USA",
        rating: 5.0,
        reviews: 94,
        bio: "Former Lead Engineer at Google. Mentoring students to master technical interviews and advanced system design.",
        hourlyRate: 110,
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        certified: false,
        category: "programming"
    },
    {
        id: 3,
        name: "Emma Rodriguez",
        subjects: ["English", "Literature"],
        subtitle: "Linguistics & Creative Writing",
        location: "London, UK",
        rating: 4.8,
        reviews: 215,
        bio: "Published novelist and Oxford graduate. Helping students unlock their narrative voice and poetic technique.",
        hourlyRate: 65,
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        certified: true,
        category: "english"
    },
    {
        id: 4,
        name: "Dr. Ahmed Hassan",
        subjects: ["Mathematics", "Physics"],
        subtitle: "Advanced Mathematics",
        location: "Dubai, UAE",
        rating: 4.9,
        reviews: 156,
        bio: "15 years of teaching experience. Making math intuitive and enjoyable for students at all levels.",
        hourlyRate: 75,
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        certified: true,
        category: "math"
    },
    {
        id: 5,
        name: "Lisa Wang",
        subjects: ["Art", "Design"],
        subtitle: "Visual Arts & UI Design",
        location: "Toronto, Canada",
        rating: 4.6,
        reviews: 89,
        bio: "Award-winning designer with 10+ years in creative industries. Teaching the fundamentals of visual storytelling.",
        hourlyRate: 90,
        profileImage: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face",
        certified: false,
        category: "art"
    },
    {
        id: 6,
        name: "Carlos Rodriguez",
        subjects: ["Spanish", "Business"],
        subtitle: "Business Spanish & Communication",
        location: "Barcelona, Spain",
        rating: 4.8,
        reviews: 132,
        bio: "Native Spanish speaker with MBA. Bridging language and business for international professionals.",
        hourlyRate: 70,
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
        certified: true,
        category: "business"
    },
];

const TeacherCard = ({ teacher }) => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group">
        <div className="relative h-64 overflow-hidden">
            <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                src={teacher.profileImage}
                alt={teacher.name}
            />
            {teacher.certified && (
                <div className="absolute top-4 left-4 bg-white/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20">
                    <BadgeCheck className="h-4 w-4 text-stitch-primary-light" />
                    <span className="text-[11px] font-bold tracking-tight text-stitch-on-surface">Certified Expert</span>
                </div>
            )}
        </div>
        <div className="p-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-bold text-stitch-on-surface font-headline">{teacher.name}</h3>
                    <p className="text-stitch-primary-light text-sm font-semibold mt-1">{teacher.subtitle}</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-stitch-on-surface font-bold text-sm">{teacher.rating}</span>
                    </div>
                    <p className="text-xs text-stitch-on-surface-variant">({teacher.reviews} reviews)</p>
                </div>
            </div>
            <p className="text-stitch-on-surface-variant text-sm leading-relaxed mb-8 line-clamp-2">
                {teacher.bio}
            </p>
            <div className="flex items-center justify-between pt-6 border-t border-stitch-outline-variant/10">
                <p className="text-lg font-bold text-stitch-on-surface">
                    ${teacher.hourlyRate}<span className="text-xs text-stitch-on-surface-variant font-normal">/hour</span>
                </p>
                <Link to={createPageUrl('FindTutors')}>
                    <Button
                        variant="outline"
                        className="rounded-xl text-stitch-primary-light border-2 border-stitch-primary-light font-bold text-sm hover:bg-stitch-primary-light hover:text-white transition-all"
                    >
                        Book Session
                    </Button>
                </Link>
            </div>
        </div>
    </div>
);

const tabsData = [
    { label: 'All', value: 'all' },
    { label: 'English', value: 'english' },
    { label: 'Programming', value: 'programming' },
    { label: 'Math', value: 'math' },
    { label: 'Art', value: 'art' },
    { label: 'Business', value: 'business' },
];

export default function TeachersSection() {
    const [activeTab, setActiveTab] = useState('all');

    const filteredTeachers = activeTab === 'all'
        ? sampleTeachers
        : sampleTeachers.filter(t => t.category === activeTab || t.category === 'all');

    return (
        <section className="bg-stitch-surface-low py-24">
            <div className="max-w-7xl mx-auto px-8">
                <div className="mb-16">
                    <span className="text-stitch-primary-light font-bold tracking-widest text-xs uppercase mb-4 block">
                        The Top 1%
                    </span>
                    <h2 className="text-4xl font-bold text-stitch-on-surface font-headline">
                        Meet Our Elite Educators
                    </h2>
                </div>

                <div className="mb-8">
                    <TabSelector
                        tabs={tabsData}
                        moreLabel="+X More"
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        maxVisibleTabs={4}
                        className="justify-center md:justify-start"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredTeachers.map(teacher => (
                        <TeacherCard key={teacher.id} teacher={teacher} />
                    ))}
                </div>

                <div className="text-center mt-12">
                    <Link to={createPageUrl('FindTutors')}>
                        <Button
                            variant="outline"
                            className="border-stitch-primary-light text-stitch-primary-light hover:bg-stitch-primary-light hover:text-white font-bold px-8 py-3 rounded-xl transition-all"
                        >
                            View Full List
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
