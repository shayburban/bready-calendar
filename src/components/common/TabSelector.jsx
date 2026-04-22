import React, { useState } from 'react';
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
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export default function TabSelector({ tabs, activeTab, onTabChange, maxVisibleTabs = 5, moreLabel = 'More', variant = 'default' }) {
  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabs = tabs.slice(maxVisibleTabs);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleSelect = (value) => {
    onTabChange(value);
    setPopoverOpen(false);
  };

  const isActiveTabHidden = hiddenTabs.some(tab => tab.value === activeTab);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleTabs.map(tab => (
        <Button
          key={tab.value}
          onClick={() => handleSelect(tab.value)}
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
              className={cn(tabVariants({ variant }), 'border-input bg-transparent flex items-center gap-1', isActiveTabHidden && 'bg-orange-200 border-orange-400 text-orange-900')}
            >
              {isActiveTabHidden ? tabs.find(t => t.value === activeTab).label : moreLabel}
              <ChevronDown className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-2 w-auto" align="end">
            <div className="flex flex-col space-y-1">
              {hiddenTabs.map(tab => (
                <Button
                  key={tab.value}
                  onClick={() => handleSelect(tab.value)}
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