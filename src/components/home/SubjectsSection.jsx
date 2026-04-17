import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, BookOpen, Code, DraftingCompass, Palette, Briefcase, Mic, Beaker, Monitor, Calculator, Music } from 'lucide-react';
import TabSelector from '../common/TabSelector';

const subjects = [
    { name: 'Mathematics', icon: <Calculator className="h-7 w-7" />, category: 'science', tutors: '1,200+' },
    { name: 'Science', icon: <Beaker className="h-7 w-7" />, category: 'science', tutors: '850+' },
    { name: 'Languages', icon: <BookOpen className="h-7 w-7" />, category: 'languages', tutors: '2,100+' },
    { name: 'Programming', icon: <Code className="h-7 w-7" />, category: 'technology', tutors: '640+' },
    { name: 'Music', icon: <Music className="h-7 w-7" />, category: 'arts', tutors: '430+' },
    { name: 'Arts', icon: <Palette className="h-7 w-7" />, category: 'arts', tutors: '510+' },
    { name: 'Engineering', icon: <DraftingCompass className="h-7 w-7" />, category: 'science', tutors: '380+' },
    { name: 'Management', icon: <Briefcase className="h-7 w-7" />, category: 'business', tutors: '290+' },
    { name: 'Technology', icon: <Monitor className="h-7 w-7" />, category: 'technology', tutors: '720+' },
];

const tabsData = [
    { label: 'All', value: 'all' },
    { label: 'Science', value: 'science' },
    { label: 'Languages', value: 'languages' },
    { label: 'Arts', value: 'arts' },
    { label: 'Business', value: 'business' },
    { label: 'Technology', value: 'technology' },
];

export default function SubjectsSection() {
    const [activeTab, setActiveTab] = useState('all');

    const filteredSubjects = activeTab === 'all'
        ? subjects
        : subjects.filter(s => s.category === activeTab);

    return (
        <section className="py-24 px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="max-w-2xl">
                    <span className="text-stitch-secondary font-bold tracking-widest text-xs uppercase mb-4 block">
                        Our Curriculum
                    </span>
                    <h2 className="text-4xl font-bold text-stitch-on-surface font-headline">
                        Explore Subjects
                    </h2>
                    <p className="text-stitch-on-surface-variant mt-4 text-lg">
                        Curated expertise across every major academic discipline and creative endeavor.
                    </p>
                </div>
                <Link
                    to={createPageUrl('FindTutors')}
                    className="text-stitch-primary-light font-bold flex items-center gap-2 hover:gap-3 transition-all"
                >
                    View all 50+ subjects <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="mb-8">
                <TabSelector
                    tabs={tabsData}
                    moreLabel="+X More"
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    maxVisibleTabs={5}
                    className="justify-center md:justify-start"
                />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {filteredSubjects.map(subject => (
                    <Link
                        key={subject.name}
                        to={createPageUrl(`FindTutors?subject=${subject.name}`)}
                        className="group bg-stitch-surface-low hover:bg-white p-8 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    >
                        <div className="bg-stitch-primary-light/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6 text-stitch-primary-light transition-transform group-hover:scale-110">
                            {subject.icon}
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-stitch-on-surface">{subject.name}</h3>
                        <p className="text-xs text-stitch-on-surface-variant font-medium">{subject.tutors} Tutors</p>
                    </Link>
                ))}
            </div>
        </section>
    );
}
