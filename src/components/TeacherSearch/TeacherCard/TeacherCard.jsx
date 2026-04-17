import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Clock, DollarSign } from 'lucide-react';

const TeacherCard = ({ teacher }) => {
    if (!teacher) {
        return null;
    }

    const {
        id,
        name,
        subjects = [],
        specializations = [],
        hourlyRate = {},
        rating = 0,
        location = '',
        languages = [],
        availability = []
    } = teacher;

    return (
        <Card className="w-full hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                            {name}
                        </CardTitle>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-medium">{rating}</span>
                            <span className="text-xs text-gray-500">({rating >= 4.5 ? 'Excellent' : 'Good'})</span>
                        </div>

                        {/* Location */}
                        {location && (
                            <div className="flex items-center gap-1 text-gray-600 mb-2">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{location}</span>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>${hourlyRate.regular || 0}/hr</span>
                        </div>
                        {hourlyRate.trial && (
                            <div className="text-xs text-gray-500">
                                Trial: ${hourlyRate.trial}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Subjects */}
                {subjects.length > 0 && (
                    <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                            {subjects.slice(0, 3).map((subject, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                    {subject}
                                </Badge>
                            ))}
                            {subjects.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{subjects.length - 3} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Specializations */}
                {specializations.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Specializations:</p>
                        <div className="flex flex-wrap gap-1">
                            {specializations.slice(0, 2).map((spec, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {spec}
                                </Badge>
                            ))}
                            {specializations.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                    +{specializations.length - 2} more
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Languages */}
                {languages.length > 0 && (
                    <div className="mb-3">
                        <p className="text-xs text-gray-600 mb-1">Languages:</p>
                        <div className="flex flex-wrap gap-1">
                            {languages.map((language, index) => (
                                <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {language}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Availability */}
                {availability.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">Available:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {availability.slice(0, 3).map((day, index) => (
                                <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                    {day}
                                </span>
                            ))}
                            {availability.length > 3 && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    +{availability.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                        View Profile
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        Book Trial
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default TeacherCard;