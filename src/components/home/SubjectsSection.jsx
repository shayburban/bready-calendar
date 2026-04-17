import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, BookOpen, Code, Feather, Mic, Beaker, Briefcase, DraftingCompass } from 'lucide-react';
import TabSelector from '../common/TabSelector';

const subjects = [
    { name: 'Language', icon: <BookOpen className="h-8 w-8 text-blue-500"/>, category: 'languages' },
    { name: 'Programming', icon: <Code className="h-8 w-8 text-green-500"/>, category: 'science' },
    { name: 'Engineering', icon: <DraftingCompass className="h-8 w-8 text-red-500"/>, category: 'science' },
    { name: 'Design', icon: <Feather className="h-8 w-8 text-purple-500"/>, category: 'arts' },
    { name: 'Accounting', icon: <Briefcase className="h-8 w-8 text-yellow-500"/>, category: 'business' },
    { name: 'Management', icon: <Mic className="h-8 w-8 text-indigo-500"/>, category: 'business' },
    { name: 'Chemistry', icon: <Beaker className="h-8 w-8 text-pink-500"/>, category: 'science' },
    { name: 'Technology', icon: <BookOpen className="h-8 w-8 text-blue-500"/>, category: 'technology' },
    { name: 'Maths', icon: <Code className="h-8 w-8 text-green-500"/>, category: 'maths' },
];

const TopicCard = ({ subject }) => (
    <div className="flex items-center p-4">
        <div className="mr-4 p-3 bg-gray-100 rounded-full">
            {subject.icon}
        </div>
        <div>
            <h3 className="font-semibold text-lg text-gray-800">{subject.name}</h3>
            <Link to={createPageUrl(`FindTutors?subject=${subject.name}`)} className="text-sm text-brand-blue hover:underline">
                View Specifics
            </Link>
        </div>
    </div>
);

const SubjectGrid = ({ category }) => {
    const filteredSubjects = category === 'all' 
        ? subjects 
        : subjects.filter(s => s.category === category);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSubjects.map(subject => (
                <Card key={subject.name} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                       <TopicCard subject={subject} />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// Define tab data for TabSelector
const tabsData = [
    { label: 'All', value: 'all' },
    { label: 'Science', value: 'science' },
    { label: 'Maths', value: 'maths' },
    { label: 'Languages', value: 'languages' },
    { label: 'Arts', value: 'arts' },
    { label: 'Business', value: 'business' },
    { label: 'Technology', value: 'technology' },
];

export default function SubjectsSection() {
    const [activeTab, setActiveTab] = useState('all');

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
    };
    
    return (
        <section className="py-16 bg-gray-100">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">
                        <span className="text-brand-blue">Select</span> Subject
                    </h2>
                    <Button variant="ghost" asChild>
                        <Link to="#" className="text-brand-blue hover:text-brand-blue">
                            Browse All <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {/* The global TabSelector is now fully responsive and dynamic */}
                    <div className="mb-8">
                        <TabSelector
                            tabs={tabsData}
                            moreLabel="+X More"
                            activeTab={activeTab}
                            onTabChange={handleTabChange}
                            maxVisibleTabs={4} // Example: show up to 4 tabs before creating a dropdown
                            className="justify-center md:justify-start"
                        />
                    </div>

                    {/* Radix UI TabsContent for backend logic and accessibility */}
                    <TabsContent value="all">
                       <SubjectGrid category="all" />
                    </TabsContent>
                    <TabsContent value="science">
                        <SubjectGrid category="science" />
                    </TabsContent>
                    <TabsContent value="maths">
                        <SubjectGrid category="maths" />
                    </TabsContent>
                    <TabsContent value="languages">
                        <SubjectGrid category="languages" />
                    </TabsContent>
                    <TabsContent value="arts">
                        <SubjectGrid category="arts" />
                    </TabsContent>
                    <TabsContent value="business">
                        <SubjectGrid category="business" />
                    </TabsContent>
                    <TabsContent value="technology">
                        <SubjectGrid category="technology" />
                    </TabsContent>
                </Tabs>
            </div>
        </section>
    );
}