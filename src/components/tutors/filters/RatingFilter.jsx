import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RatingOption = ({ rating }) => (
    <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star 
                key={star} 
                className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
            />
        ))}
        <span className="text-sm text-gray-600">& up</span>
    </div>
);

export default function RatingFilter({ value, onChange }) {
    const ratingOptions = [4, 3, 2, 1];

    return (
        <div className="space-y-4">
            <RadioGroup value={String(value)} onValueChange={(val) => onChange(Number(val))}>
                {ratingOptions.map((rating) => (
                     <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
                        <Label htmlFor={`rating-${rating}`} className="cursor-pointer">
                            <RatingOption rating={rating} />
                        </Label>
                    </div>
                ))}
            </RadioGroup>
            <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => onChange(0)}>
                Reset
            </Button>
        </div>
    );
}