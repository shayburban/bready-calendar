import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

const TimeSlotPill = ({ time, active, onClick }) => (
    <Button
        variant={active ? "default" : "outline"}
        onClick={onClick}
        className={`rounded-md h-8 px-3 text-xs whitespace-nowrap transition-colors ${active ? 'bg-green-600 text-white border border-green-700 hover:bg-green-700' : 'bg-white border border-green-600 text-green-700 hover:bg-green-50'}`}
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
    maxVisible = 3,
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

    // The "+x More" overflow menu opens on HOVER (not only click). modal={false}
    // + a short close delay let the pointer travel from the trigger onto the menu
    // without it snapping shut. Click and item selection still work unchanged.
    const [overflowOpen, setOverflowOpen] = useState(false);
    const overflowCloseTimer = useRef(null);
    const openOverflowOnHover = () => {
        if (overflowCloseTimer.current) clearTimeout(overflowCloseTimer.current);
        setOverflowOpen(true);
    };
    const closeOverflowOnHoverOut = () => {
        overflowCloseTimer.current = setTimeout(() => setOverflowOpen(false), 120);
    };

    const overflowSlots = timeSlots.filter(slot => !displayedSlots.includes(slot));

    return (
        <div className="flex justify-center items-center flex-nowrap gap-2">
            {displayedSlots.map(slot => (
                <TimeSlotPill
                    key={slot}
                    time={slot}
                    active={slot === activeSlot}
                    onClick={() => handleSelectSlot(slot)}
                />
            ))}

            {overflowSlots.length > 0 && (
                <DropdownMenu open={overflowOpen} onOpenChange={setOverflowOpen} modal={false}>
                    <DropdownMenuTrigger asChild onMouseEnter={openOverflowOnHover} onMouseLeave={closeOverflowOnHoverOut}>
                        <Button variant="outline" className="rounded-md h-8 px-3 text-xs whitespace-nowrap bg-white border border-green-600 text-green-700 hover:bg-green-50">
                            +{overflowSlots.length} More <ChevronDown className="w-4 h-4 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        onMouseEnter={openOverflowOnHover}
                        onMouseLeave={closeOverflowOnHoverOut}
                        onCloseAutoFocus={(e) => e.preventDefault()}
                    >
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