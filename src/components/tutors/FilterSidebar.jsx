import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';
// ... import all filter components ...
import LanguageFilter from './filters/LanguageFilter';
import SpecializationFilter from './filters/SpecializationFilter';
import SubjectFilter from './filters/SubjectFilter';
import AvailabilityFilter from './filters/AvailabilityFilter';
import HourlyRateFilter from './filters/HourlyRateFilter';
import CancellationFilter from './filters/CancellationFilter';
import RatingFilter from './filters/RatingFilter';
import ReviewsFilter from './filters/ReviewsFilter';
import ServicesFilter from './filters/ServicesFilter';
import RegionFilter from './filters/RegionFilter';
import ExperienceFilter from './filters/ExperienceFilter';
import ResponseTimeFilter from './filters/ResponseTimeFilter';
import ArrivingOnTimeFilter from './filters/ArrivingOnTimeFilter';

export default function FilterSidebar({ isOpen, onClose, filters, onFilterChange }) {
    const FilterContent = () => (
        <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow-sm border">
                <Accordion type="multiple" defaultValue={['languages', 'subject']} className="w-full">
                    <AccordionItem value="languages">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Teacher Speaks</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <LanguageFilter 
                                selected={filters.languages || []}
                                onChange={(value) => onFilterChange('languages', value)}
                            />
                        </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="subject">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Subject</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <SubjectFilter 
                                selected={filters.subjects || []}
                                onChange={(value) => onFilterChange('subjects', value)}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="hourly-rate">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Hourly Rate</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <HourlyRateFilter 
                                value={filters.hourlyRate || [1, 200]}
                                onChange={(value) => onFilterChange('hourlyRate', value)}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="rating">
                        <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Rating</AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <RatingFilter 
                                value={filters.rating || 0}
                                onChange={(value) => onFilterChange('rating', value)}
                            />
                        </AccordionContent>
                    </AccordionItem>

                    {/* Other filters can be connected similarly */}
                    <AccordionItem value="specialization">
                         <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Specialization</AccordionTrigger>
                         <AccordionContent className="px-4 pb-4">
                             <SpecializationFilter />
                         </AccordionContent>
                     </AccordionItem>
                    <AccordionItem value="availability">
                         <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Availability</AccordionTrigger>
                         <AccordionContent className="px-4 pb-4">
                             <AvailabilityFilter />
                         </AccordionContent>
                     </AccordionItem>
                    <AccordionItem value="cancellation">
                         <AccordionTrigger className="px-4 py-3 text-sm font-semibold">Cancellation Policy</AccordionTrigger>
                         <AccordionContent className="px-4 pb-4">
                             <CancellationFilter />
                         </AccordionContent>
                     </AccordionItem>
                     {/* ... etc for all other filters */}
                </Accordion>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block">
                <FilterContent />
            </div>

            {/* Mobile Filter Sheet */}
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Filter Panel
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                        <FilterContent />
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}