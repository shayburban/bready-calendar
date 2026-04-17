import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TrendingItem = ({ subject, imageUrl, href }) => (
    <div className="col-span-1">
        <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-4 text-center">
            <Link to={createPageUrl(href)} className="block">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <img src={imageUrl} alt={subject} className="w-12 h-12 rounded-full object-cover" />
                </div>
                <p className="text-gray-800 font-medium">{subject}</p>
            </Link>
        </div>
    </div>
);

const trendingSubjects = [
    { subject: 'English', imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=English' },
    { subject: 'Web Design', imageUrl: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=WebDesign' },
    { subject: 'Programming', imageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=Programming' },
    { subject: 'Mathematics', imageUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=Mathematics' },
    { subject: 'Chemistry', imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=Chemistry' },
    { subject: 'Physics', imageUrl: 'https://images.unsplash.com/photo-1636953056323-9c09fdd74fa6?w=100&h=100&fit=crop&crop=center', href: 'FindTutors?subject=Physics' },
];

export default function TrendingSection() {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 text-center">Trending</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {trendingSubjects.map((item, index) => (
                        <TrendingItem 
                            key={index}
                            subject={item.subject}
                            imageUrl={item.imageUrl}
                            href={item.href}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}