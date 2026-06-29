import React, { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const tabVariants = cva(
  "h-9 px-3 rounded-md transition-colors",
  {
    variants: {
      variant: {
        default: "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-muted",
        orange: "data-[state=active]:bg-orange-200 data-[state=active]:border-orange-400 data-[state=active]:text-orange-900 border border-orange-300 text-orange-800 hover:bg-orange-200 hover:border-orange-400",
        red: "data-[state=active]:bg-red-200 data-[state=active]:border-red-400 data-[state=active]:text-red-900 border border-red-300 text-red-800 hover:bg-red-200 hover:border-red-400",
        green: "data-[state=active]:bg-green-200 data-[state=active]:border-green-400 data-[state=active]:text-green-900 border border-green-300 text-green-800 hover:bg-green-200 hover:border-green-400",
        black: "data-[state=active]:bg-gray-800 data-[state=active]:border-gray-900 data-[state=active]:text-white border border-gray-700 text-gray-800 hover:bg-gray-800 hover:text-white hover:border-gray-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export default function TabSelector({ tabs, activeTab, onTabChange, maxVisibleTabs = 5, moreLabel = 'More', variant = 'default' }) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Task 4 — a slot chosen from the "+x More" dropdown is PROMOTED to the front of
  // the visible row, so it renders as an ordinary visible button. This gives it the
  // EXACT same active styling (variant `data-[state=active]` classes) as a slot that
  // was clicked directly — no separate "selected from dropdown" styling. Selecting a
  // different slot clears the promotion, so the previously-promoted slot returns to
  // its original chronological position in the array.
  const [promotedValue, setPromotedValue] = useState(null);

  const orderedTabs = useMemo(() => {
    if (!promotedValue) return tabs;
    const promoted = tabs.find((t) => t.value === promotedValue);
    if (!promoted) return tabs; // promoted slot no longer exists → ignore
    return [promoted, ...tabs.filter((t) => t.value !== promotedValue)];
  }, [tabs, promotedValue]);

  const visibleTabs = orderedTabs.slice(0, maxVisibleTabs);
  const hiddenTabs = orderedTabs.slice(maxVisibleTabs);

  // The "+x More" overflow opens immediately on HOVER (onMouseEnter), not only
  // on click. A short close delay lets the pointer travel from the trigger onto
  // the (portaled) popover content without it snapping shut. Click still toggles
  // the menu via the same controlled `popoverOpen` state.
  const hoverCloseTimer = useRef(null);
  const openOnHover = () => {
    if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
    setPopoverOpen(true);
  };
  const closeOnHoverOut = () => {
    hoverCloseTimer.current = setTimeout(() => setPopoverOpen(false), 120);
  };

  // Clicking a VISIBLE slot clears any promotion (unless it's the promoted slot
  // itself being re-clicked), returning the previously promoted slot to its
  // chronological order.
  const handleSelectVisible = (value) => {
    if (value !== promotedValue) setPromotedValue(null);
    onTabChange(value);
  };

  // Selecting from the dropdown promotes that slot to the front of the visible row.
  const handleSelectHidden = (value) => {
    setPromotedValue(value);
    onTabChange(value);
    setPopoverOpen(false);
  };

  // With promotion, the active slot is normally promoted into the visible row, so
  // this only matters if the parent sets `activeTab` to a still-hidden value
  // directly. We render that on the More trigger using the SAME variant active
  // styling (data-state) rather than a hardcoded color, for consistency.
  const isActiveTabHidden = hiddenTabs.some((tab) => tab.value === activeTab);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTabs.map((tab) => (
        <Button
          key={tab.value}
          onClick={() => handleSelectVisible(tab.value)}
          variant="outline"
          size="sm"
          className={cn(tabVariants({ variant }), 'border-input bg-transparent')}
          data-state={activeTab === tab.value ? 'active' : 'inactive'}
        >
          {tab.label}
        </Button>
      ))}

      {hiddenTabs.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onMouseEnter={openOnHover}
              onMouseLeave={closeOnHoverOut}
              className={cn(tabVariants({ variant }), 'border-input bg-transparent flex items-center gap-1')}
              data-state={isActiveTabHidden ? 'active' : 'inactive'}
            >
              {isActiveTabHidden ? tabs.find((t) => t.value === activeTab).label : moreLabel}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto" align="end" onMouseEnter={openOnHover} onMouseLeave={closeOnHoverOut}>
            <div className="flex flex-col space-y-1">
              {hiddenTabs.map((tab) => (
                <Button
                  key={tab.value}
                  onClick={() => handleSelectHidden(tab.value)}
                  variant="ghost"
                  className={cn("w-full justify-start", activeTab === tab.value && 'bg-accent')}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
