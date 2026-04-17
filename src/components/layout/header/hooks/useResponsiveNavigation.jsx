import { useState, useEffect, useCallback, useRef } from 'react';

export const useResponsiveNavigation = ({ 
    items, 
    reservedWidth = 0, 
    alwaysVisibleItems = [] 
}) => {
    const [visibleItems, setVisibleItems] = useState([]);
    const [overflowItems, setOverflowItems] = useState([]);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef(null);
    const itemRefs = useRef({});

    // Debounced resize handler for performance
    const handleResize = useCallback(() => {
        if (!containerRef.current) return;
        
        const newWidth = containerRef.current.offsetWidth;
        setContainerWidth(newWidth);
    }, []);

    useEffect(() => {
        const debouncedResize = debounce(handleResize, 150);
        window.addEventListener('resize', debouncedResize);
        handleResize(); // Initial measurement
        
        return () => {
            window.removeEventListener('resize', debouncedResize);
        };
    }, [handleResize]);

    // Calculate which items fit based on available width
    const calculateVisibleItems = useCallback(() => {
        if (!containerWidth || !items.length) return;

        const availableWidth = containerWidth - reservedWidth;
        let usedWidth = 0;
        const visible = [];
        const overflow = [];

        // Always include alwaysVisible items first
        const alwaysVisibleSet = new Set(alwaysVisibleItems);
        
        // Sort items by priority (higher priority = stays visible longer)
        const sortedItems = [...items].sort((a, b) => (b.priority || 1) - (a.priority || 1));

        for (const item of sortedItems) {
            const itemElement = itemRefs.current[item.key];
            const itemWidth = itemElement ? itemElement.offsetWidth : estimateItemWidth(item);
            
            if (alwaysVisibleSet.has(item.key) || usedWidth + itemWidth <= availableWidth) {
                visible.push(item);
                usedWidth += itemWidth;
            } else {
                overflow.push(item);
            }
        }

        setVisibleItems(visible);
        setOverflowItems(overflow);
    }, [containerWidth, items, reservedWidth, alwaysVisibleItems]);

    useEffect(() => {
        calculateVisibleItems();
    }, [calculateVisibleItems]);

    // Estimate item width for items not yet rendered
    const estimateItemWidth = (item) => {
        if (item.type === 'nav') return 120; // Average nav item width
        if (item.type === 'component') return 100; // Average component width
        return 80; // Default
    };

    // Ref callback to measure item widths
    const setItemRef = useCallback((key, element) => {
        if (element) {
            itemRefs.current[key] = element;
        }
    }, []);

    return {
        visibleItems,
        overflowItems,
        containerRef,
        setItemRef,
        containerWidth
    };
};

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}