import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';

const JourneyStep = ({ stepNumber, title, isActive = false }) => (
    <li className={`relative ${isActive ? 'text-brand-blue' : 'text-gray-500'}`}>
        <div className="flex items-center">
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isActive 
                    ? 'bg-brand-blue text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
            `}>
                {stepNumber}
            </div>
            <span className="ml-3 text-sm font-medium">{title}</span>
        </div>
        {stepNumber < 5 && (
            <div className={`
                absolute top-4 left-4 w-px h-8 
                ${isActive ? 'bg-brand-blue' : 'bg-gray-300'}
            `} />
        )}
    </li>
);

const BreadcrumbStep = ({ stepNumber, title, isActive = false }) => (
    <li className="relative">
        <div className={`
            flex items-center px-4 py-2 text-sm font-medium
            ${isActive 
                ? 'bg-brand-blue text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
            ${stepNumber === 1 ? 'rounded-l-lg' : ''}
            ${stepNumber === 5 ? 'rounded-r-lg' : ''}
        `}>
            <span className="mr-2">{stepNumber}</span>
            <span className="hidden sm:inline">{title}</span>
        </div>
        {stepNumber < 5 && (
            <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-b-[20px] border-l-[12px] border-transparent border-l-current transform translate-x-full" />
        )}
    </li>
);

const journeySteps = [
    { number: 1, title: "Search A Keyword" },
    { number: 2, title: "Select A Teacher" },
    { number: 3, title: "Book A Session" },
    { number: 4, title: "Checkout" },
    { number: 5, title: "Payment" }
];

export default function JourneySection() {
    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 text-center">
                        <span className="text-brand-blue">Your</span> Journey
                    </h2>
                </div>

                {/* Desktop Breadcrumb */}
                <div className="hidden md:block mb-8">
                    <div className="flex justify-center">
                        <ol className="flex items-center space-x-0">
                            {journeySteps.map((step, index) => (
                                <BreadcrumbStep 
                                    key={step.number}
                                    stepNumber={step.number}
                                    title={step.title}
                                    isActive={index === 0}
                                />
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Mobile Steps */}
                <div className="md:hidden mb-8">
                    <ol className="space-y-4 max-w-md mx-auto">
                        {journeySteps.map((step, index) => (
                            <JourneyStep 
                                key={step.number}
                                stepNumber={step.number}
                                title={step.title}
                                isActive={index === 0}
                            />
                        ))}
                    </ol>
                </div>

                {/* Search Section */}
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gray-50 rounded-lg p-8">
                        <div className="flex justify-center">
                            <div className="w-full max-w-2xl">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input 
                                        type="text" 
                                        placeholder="Search a subject or keyword" 
                                        className="flex-grow"
                                    />
                                    <Select defaultValue="all">
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Services</SelectItem>
                                            <SelectItem value="online-class">Online Class</SelectItem>
                                            <SelectItem value="consulting">Consulting</SelectItem>
                                            <SelectItem value="interview">Technical Interview</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button className="bg-brand-blue hover:bg-brand-blue-dark">
                                        <Search className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}