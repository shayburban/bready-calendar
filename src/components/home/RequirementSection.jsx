import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, X, Search } from 'lucide-react';

const RequirementStep = ({ stepNumber, title, isActive = false }) => (
    <li className="relative">
        <div className={`
            flex items-center px-4 py-2 text-sm font-medium
            ${isActive 
                ? 'bg-brand-blue text-white' 
                : 'bg-gray-100 text-gray-600'
            }
            ${stepNumber === 1 ? 'rounded-l-lg' : ''}
            ${stepNumber === 4 ? 'rounded-r-lg' : ''}
        `}>
            <span className="mr-2">{stepNumber}</span>
            <span className="hidden sm:inline">{title}</span>
        </div>
        {stepNumber < 4 && (
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-b-[20px] border-l-[12px] border-transparent border-l-current transform translate-x-full" />
        )}
    </li>
);

const LanguageSelector = () => {
    const [selectedLanguages, setSelectedLanguages] = useState([
        { name: 'English', level: 'Expert', flag: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop' }
    ]);
    const [isOpen, setIsOpen] = useState(false);

    const availableLanguages = [
        { name: 'Spanish', flag: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop' },
        { name: 'French', flag: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop' },
        { name: 'German', flag: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop' },
        { name: 'Italian', flag: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=32&h=24&fit=crop' },
    ];

    const removeLanguage = (languageToRemove) => {
        setSelectedLanguages(selectedLanguages.filter(lang => lang.name !== languageToRemove.name));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Languages Spoken</h3>
            
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        Select Language
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-0">
                    <div className="p-4 border-b">
                        <h4 className="font-semibold text-gray-900 mb-3">Select Language</h4>
                        <div className="relative">
                            <Input placeholder="Search" className="pr-8" />
                            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {availableLanguages.map((language) => (
                            <DropdownMenuItem key={language.name} className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-3">
                                    <img src={language.flag} alt={language.name} className="w-6 h-4 rounded-sm" />
                                    <span>{language.name}</span>
                                </div>
                                <Select defaultValue="expert">
                                    <SelectTrigger className="w-24 h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="beginner">Beginner</SelectItem>
                                        <SelectItem value="intermediate">Intermediate</SelectItem>
                                        <SelectItem value="advanced">Advanced</SelectItem>
                                        <SelectItem value="expert">Expert</SelectItem>
                                    </SelectContent>
                                </Select>
                            </DropdownMenuItem>
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((language) => (
                    <Badge key={language.name} variant="secondary" className="flex items-center gap-2 px-3 py-1">
                        <img src={language.flag} alt={language.name} className="w-4 h-3 rounded-sm" />
                        <span>{language.name}, {language.level}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-transparent"
                            onClick={() => removeLanguage(language)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                ))}
            </div>
        </div>
    );
};

const requirementSteps = [
    { number: 1, title: "Skills Of Teacher" },
    { number: 2, title: "Your Requirement" },
    { number: 3, title: "Hourly Rate & Service" },
    { number: 4, title: "Confirmation" }
];

export default function RequirementSection() {
    return (
        <section className="py-16 bg-gray-100">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 text-center">
                        <span className="text-brand-blue">Post</span> A Requirement
                    </h2>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex justify-center">
                        <ol className="flex items-center space-x-0">
                            {requirementSteps.map((step, index) => (
                                <RequirementStep 
                                    key={step.number}
                                    stepNumber={step.number}
                                    title={step.title}
                                    isActive={index === 0}
                                />
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto">
                    <Card className="bg-white shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl text-gray-800">Teacher Speaks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <LanguageSelector />
                                </div>
                                <div className="lg:border-l lg:pl-8">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Requirements</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Subject Expertise
                                            </label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select subject" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="programming">Programming</SelectItem>
                                                    <SelectItem value="mathematics">Mathematics</SelectItem>
                                                    <SelectItem value="english">English</SelectItem>
                                                    <SelectItem value="science">Science</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Experience Level
                                            </label>
                                            <Select>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select experience" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1-2">1-2 years</SelectItem>
                                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                                    <SelectItem value="5+">5+ years</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 text-center">
                                <Button className="bg-brand-green hover:bg-brand-green-dark px-8">
                                    Load More Skills Of Teacher
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}