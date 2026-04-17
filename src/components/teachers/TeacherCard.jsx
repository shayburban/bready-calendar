import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Star, MapPin, Clock, Users, Briefcase, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ExperienceIcon = ({ icon: Icon, years, tooltip }) => (
    <div className="text-center" title={tooltip}>
        <Icon className="h-6 w-6 mx-auto mb-1 text-gray-600" />
        <p className="text-xs text-gray-700">{years} Year{years !== 1 ? 's' : ''}</p>
    </div>
);

const LanguageFlag = ({ language }) => (
    <div className="text-center">
        <img src={language.flag} alt={language.name} className="w-6 h-4 mx-auto mb-1 rounded-sm" />
        <p className="text-xs text-gray-700">
            {language.name}
            <br />
            <span className="text-gray-500">{language.level}</span>
        </p>
    </div>
);

const SubjectDropdown = ({ subjects, expertSubject }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm text-gray-600 hover:text-brand-blue p-0 h-auto">
                Expert in {expertSubject} <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            {subjects.map((subject, index) => (
                <DropdownMenuItem key={index}>
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    {subject} (Expert)
                </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
    </DropdownMenu>
);

const RatesDropdown = ({ rates }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm p-0 h-auto">
                Minimum Hourly Rate <span className="text-brand-blue">${rates.minimum}</span> /Hr.
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <div className="p-3 space-y-1">
                <div className="text-sm">Online Class: <span className="text-brand-blue">${rates.minimum}</span> /Hr.</div>
                <div className="text-sm">Consulting: <span className="text-brand-blue">${rates.minimum + 5}</span> /Hr.</div>
                <div className="text-sm">Technical Interview: <span className="text-brand-blue">${rates.minimum + 10}</span> /Hr.</div>
            </div>
        </DropdownMenuContent>
    </DropdownMenu>
);

export default function TeacherCard({ teacher }) {
    return (
        <Card className="bg-white hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4">
                <div className="relative mx-auto">
                    <div className="w-24 h-24 mx-auto mb-4 relative">
                        <img 
                            src={teacher.profileImage} 
                            alt={teacher.name}
                            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2 bg-brand-blue text-white text-xs px-2 py-1 rounded-full">
                            <Star className="h-3 w-3 inline mr-1" />
                            {teacher.rating}
                        </div>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <Link to={createPageUrl('FindTutors')} className="hover:text-brand-blue">
                            {teacher.name}
                        </Link>
                    </h3>
                    
                    <SubjectDropdown 
                        subjects={teacher.subjects} 
                        expertSubject={teacher.subjects[0]} 
                    />
                    
                    <p className="text-sm text-gray-600 mt-2 flex items-center justify-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {teacher.location}
                    </p>
                </div>

                {/* Experience Section */}
                <div className="grid grid-cols-4 gap-2 py-4 border-t border-b border-gray-100">
                    <ExperienceIcon 
                        icon={Clock} 
                        years={teacher.experience.online} 
                        tooltip="Online teaching experience" 
                    />
                    <ExperienceIcon 
                        icon={Users} 
                        years={teacher.experience.offline} 
                        tooltip="Offline teaching experience" 
                    />
                    <ExperienceIcon 
                        icon={Briefcase} 
                        years={teacher.experience.industry} 
                        tooltip="Industry experience" 
                    />
                    <div className="text-center" title="Success rate and cancellation policy">
                        <div className="text-lg font-semibold text-green-600">98%</div>
                        <p className="text-xs text-gray-500">10D & 3H</p>
                    </div>
                </div>

                {/* Languages Section */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Speaks</h4>
                    <div className="grid grid-cols-3 gap-2">
                        {teacher.languages.slice(0, 2).map((language, index) => (
                            <LanguageFlag key={index} language={language} />
                        ))}
                        {teacher.languages.length > 2 && (
                            <div className="text-center">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-auto p-0">
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        {teacher.languages.slice(2).map((language, index) => (
                                            <DropdownMenuItem key={index}>
                                                <img src={language.flag} alt={language.name} className="w-4 h-3 mr-2 rounded-sm" />
                                                {language.name} ({language.level})
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Section */}
                <div className="space-y-2">
                    <p className="text-sm">
                        Trial Lesson: <span className="text-brand-blue font-semibold">${teacher.hourlyRate.trial}</span> /Hr.
                    </p>
                    <div className="text-sm">
                        <RatesDropdown rates={teacher.hourlyRate} />
                    </div>
                    <Button className="w-full bg-brand-green hover:bg-brand-green-dark">
                        Book A Trial
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}