import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';

const OverflowTagDisplay = ({ 
    items = [], 
    maxVisible = 5, 
    onRemove, 
    className = "",
    showRemoveButton = true 
}) => {
    const [visibleCount, setVisibleCount] = useState(1); // Start conservative
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const measureRef = useRef(null);

    if (!items || items.length === 0) {
        return null;
    }

    // Calculate how many items can fit in the available space
    useEffect(() => {
        const calculateVisibleItems = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const moreButtonWidth = 80; // Fixed width for "+X More" button
            const itemGap = 8; // Gap between items
            const safetyMargin = 20; // Extra margin to prevent overflow
            
            const availableWidth = containerWidth - moreButtonWidth - safetyMargin;
            
            // Measure actual item widths if possible
            let totalItemWidth = 0;
            let itemCount = 0;
            
            // Calculate based on estimated item width
            const estimatedItemWidth = 120; // Conservative estimate
            
            for (let i = 0; i < Math.min(items.length, maxVisible); i++) {
                const estimatedWidth = estimatedItemWidth + itemGap;
                if (totalItemWidth + estimatedWidth <= availableWidth) {
                    totalItemWidth += estimatedWidth;
                    itemCount++;
                } else {
                    break;
                }
            }
            
            // Always show at least 1 item, never more than maxVisible
            const newVisibleCount = Math.max(1, Math.min(itemCount, maxVisible, items.length));
            
            // Only update if different to prevent re-renders
            setVisibleCount(prev => prev !== newVisibleCount ? newVisibleCount : prev);
        };

        // Initial calculation
        calculateVisibleItems();
        
        // Recalculate on resize with debouncing
        const handleResize = () => {
            clearTimeout(window.resizeTimeout);
            window.resizeTimeout = setTimeout(calculateVisibleItems, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            if (window.resizeTimeout) {
                clearTimeout(window.resizeTimeout);
            }
        };
    }, [items.length, maxVisible]);

    const visibleItems = items.slice(0, visibleCount);
    const overflowItems = items.slice(visibleCount);
    const hasOverflow = overflowItems.length > 0;

    return (
        <div 
            ref={containerRef} 
            className={`flex items-center gap-2 w-full overflow-hidden ${className}`}
        >
            {/* Container for visible items - flex-shrink to prevent overflow */}
            <div className="flex items-center gap-2 flex-shrink min-w-0">
                {visibleItems.map((item, index) => (
                    <div
                        key={item.id || index}
                        className="rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                    >
                        <span className="truncate max-w-[100px]">
                            {item.fullDisplay || `${item.language || item.subject || item.specialization} (${item.proficiency || item.level})`}
                        </span>
                        {showRemoveButton && onRemove && (
                            <button
                                onClick={() => onRemove(item.id || item)}
                                className="ml-1 hover:text-red-500 flex-shrink-0"
                                aria-label={`Remove ${item.fullDisplay || item.display}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Overflow button - fixed width, always visible when needed */}
            {hasOverflow && (
                <div className="flex-shrink-0 ml-auto">
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-auto min-h-0 text-xs px-2 py-1 border-dashed whitespace-nowrap w-[70px]"
                                onMouseEnter={() => setIsOpen(true)}
                                onMouseLeave={() => {
                                    setTimeout(() => setIsOpen(false), 200);
                                }}
                            >
                                +{overflowItems.length} More
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-80 p-0" 
                            align="end"
                            side="bottom"
                            sideOffset={5}
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            onMouseEnter={() => setIsOpen(true)}
                            onMouseLeave={() => setIsOpen(false)}
                        >
                            <div className="p-3 border-b">
                                <h4 className="font-semibold text-sm text-gray-900">Additional Items</h4>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-3">
                                <div className="space-y-2">
                                    {overflowItems.map((item, index) => (
                                        <div
                                            key={item.id || (visibleCount + index)}
                                            className="flex items-center justify-between p-2 border rounded-md bg-gray-50 text-xs"
                                        >
                                            <span className="flex-1 truncate pr-2">
                                                {item.fullDisplay || `${item.language || item.subject || item.specialization} (${item.proficiency || item.level})`}
                                            </span>
                                            {showRemoveButton && onRemove && (
                                                <button
                                                    onClick={() => onRemove(item.id || item)}
                                                    className="text-gray-500 hover:text-red-600 flex-shrink-0 rounded-full hover:bg-gray-200 p-0.5"
                                                    aria-label={`Remove ${item.fullDisplay || item.display}`}
                                                >
                                                    <X size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </div>
    );
};

export default OverflowTagDisplay;