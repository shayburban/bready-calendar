import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Maximize, 
  Minimize,
  Calendar,
  Download
} from 'lucide-react';

export default function CalendarHeader({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onToday,
  onFullscreen,
  isFullscreen
}) {
  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="border-b bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
          >
            Today
          </Button>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-900 ml-4">
              {monthYear}
            </h2>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* Current Price Dropdown */}
          <div className="hidden md:flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Current Price
            </Badge>
            <div className="text-sm text-gray-600">
              Online: $10/hr • Consulting: $15/hr
            </div>
          </div>

          {/* Calendar Sync */}
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md">
            <span className="text-sm text-gray-600">Synchronize Calendar with</span>
            <label className="flex items-center space-x-1 text-sm">
              <input type="checkbox" className="w-3 h-3" />
              <span>Google</span>
            </label>
            <label className="flex items-center space-x-1 text-sm">
              <input type="checkbox" className="w-3 h-3" />
              <span>Apple</span>
            </label>
          </div>

          {/* View Selector */}
          <Select value={view} onValueChange={onViewChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onFullscreen}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}