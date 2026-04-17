import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BookOpen, Monitor, Code, Calculator, Beaker, Atom } from 'lucide-react';

const trendingSubjects = [
    { subject: 'English', icon: <BookOpen className="h-8 w-8" />, href: 'FindTutors?subject=English' },
    { subject: 'Web Design', icon: <Monitor className="h-8 w-8" />, href: 'FindTutors?subject=WebDesign' },
    { subject: 'Programming', icon: <Code className="h-8 w-8" />, href: 'FindTutors?subject=Programming' },
    { subject: 'Mathematics', icon: <Calculator className="h-8 w-8" />, href: 'FindTutors?subject=Mathematics' },
    { subject: 'Chemistry', icon: <Beaker className="h-8 w-8" />, href: 'FindTutors?subject=Chemistry' },
    { subject: 'Physics', icon: <Atom className="h-8 w-8" />, href: 'FindTutors?subject=Physics' },
];

export default function TrendingSection() {
    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-8">
                <div className="mb-12 text-center">
                    <span className="text-stitch-secondary font-bold tracking-widest text-xs uppercase mb-4 block">
                        Popular Now
                    </span>
                    <h2 className="text-4xl font-bold text-stitch-on-surface font-headline">Trending Subjects</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {trendingSubjects.map((item) => (
                        <Link
                            key={item.subject}
                            to={createPageUrl(item.href)}
                            className="group flex flex-col items-center p-6 rounded-xl hover:bg-stitch-surface-low transition-all duration-300"
                        >
                            <div className="w-20 h-20 bg-stitch-surface-low group-hover:bg-white rounded-full flex items-center justify-center mb-4 text-stitch-primary-light transition-all duration-300 group-hover:shadow-lg group-hover:scale-110">
                                {item.icon}
                            </div>
                            <p className="text-stitch-on-surface font-semibold text-sm">{item.subject}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
