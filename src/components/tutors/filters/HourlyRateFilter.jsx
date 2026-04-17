import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function HourlyRateFilter({ value, onChange }) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-sm font-medium">Price Range: ${value[0]} - ${value[1]}</Label>
                <Slider
                    value={value}
                    onValueChange={onChange}
                    max={200}
                    min={1}
                    step={1}
                    className="w-full"
                />
            </div>
             <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => onChange([1, 200])}>
                Reset
            </Button>
        </div>
    );
}