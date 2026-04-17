import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const TimeSlotPill = ({ time, active, onClick }) => (
    <Button 
        variant={active ? "solid" : "outline"}
        onClick={onClick}
        className={`rounded-full h-8 px-4 transition-colors ${active ? 'bg-green-600 text-white hover:bg-green-700' : 'border-green-600 text-green-700 hover:bg-green-50'}`}
    >
        {time}
    </Button>
);

const NavigationWithinLegend = ({
    timeSlots = [],
    onSlotSelect,
    maxVisible = 2
}) => {
    const [displayedSlots, setDisplayedSlots] = useState([]);
    const [activeSlot, setActiveSlot] = useState('');

    useEffect(() => {
        if (timeSlots.length > 0) {
            setDisplayedSlots(timeSlots.slice(0, maxVisible));
            const initialActiveSlot = timeSlots[0];
            setActiveSlot(initialActiveSlot);
            if (onSlotSelect) onSlotSelect(initialActiveSlot);
        }
    }, [timeSlots, maxVisible]);

    const handleSelectSlot = (slot) => {
        setActiveSlot(slot);

        if (!displayedSlots.includes(slot)) {
            const newDisplayedSlots = [slot];
            const remainingOriginalSlots = timeSlots.filter(s => s !== slot);
            
            for (let i = 0; newDisplayedSlots.length < maxVisible && i < remainingOriginalSlots.length; i++) {
                newDisplayedSlots.push(remainingOriginalSlots[i]);
            }
            setDisplayedSlots(newDisplayedSlots);
        }

        if (onSlotSelect) {
            onSlotSelect(slot);
        }
    };
    
    const overflowSlots = timeSlots.filter(slot => !displayedSlots.includes(slot));

    return (
        <div className="flex justify-center items-center flex-wrap gap-2">
            {displayedSlots.map(slot => (
                <TimeSlotPill 
                    key={slot}
                    time={slot}
                    active={slot === activeSlot}
                    onClick={() => handleSelectSlot(slot)}
                />
            ))}
            
            {overflowSlots.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="rounded-full h-8 px-4">
                            +{overflowSlots.length} More <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {overflowSlots.map(slot => (
                             <DropdownMenuItem key={slot} onSelect={() => handleSelectSlot(slot)}>
                                {slot}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
};

export default NavigationWithinLegend;