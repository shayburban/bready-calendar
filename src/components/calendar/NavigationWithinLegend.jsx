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

// When `activeSlot` is supplied the component runs in controlled mode and
// purely reflects the parent's selection. Otherwise it manages its own
// active-slot state (legacy behavior, still used inside cards that don't
// route slot changes back up to the modal).
const NavigationWithinLegend = ({
    timeSlots = [],
    onSlotSelect,
    maxVisible = 2,
    activeSlot: activeSlotProp,
}) => {
    const isControlled = activeSlotProp !== undefined;
    const [displayedSlots, setDisplayedSlots] = useState([]);
    const [internalActiveSlot, setInternalActiveSlot] = useState('');
    const activeSlot = isControlled ? activeSlotProp : internalActiveSlot;

    useEffect(() => {
        if (timeSlots.length > 0) {
            setDisplayedSlots(timeSlots.slice(0, maxVisible));
            if (!isControlled) {
                const initialActiveSlot = timeSlots[0];
                setInternalActiveSlot(initialActiveSlot);
                if (onSlotSelect) onSlotSelect(initialActiveSlot);
            }
        }
    }, [timeSlots, maxVisible, isControlled]);

    // Keep the visible row anchored on the controlled activeSlot — if the
    // parent picks a slot that's currently in overflow, promote it.
    useEffect(() => {
        if (!isControlled || !activeSlotProp) return;
        if (displayedSlots.includes(activeSlotProp)) return;
        if (!timeSlots.includes(activeSlotProp)) return;
        const next = [activeSlotProp];
        const rest = timeSlots.filter((s) => s !== activeSlotProp);
        for (let i = 0; next.length < maxVisible && i < rest.length; i++) {
            next.push(rest[i]);
        }
        setDisplayedSlots(next);
    }, [activeSlotProp, isControlled, timeSlots, maxVisible, displayedSlots]);

    const handleSelectSlot = (slot) => {
        if (!isControlled) setInternalActiveSlot(slot);

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