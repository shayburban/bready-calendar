import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeSlot = ({ time, available = true, isSelected = false }) => {
  if (!available) {
    return (
      <div className="w-full h-8 bg-gray-100 border border-gray-200 rounded cursor-not-allowed opacity-50">
        {/* Empty unavailable slot */}
      </div>
    );
  }

  return (
    <Button
      variant={isSelected ? "default" : "outline"}
      size="sm"
      className={`w-full h-8 text-xs flex items-center justify-center transition-all ${
        isSelected
          ? 'bg-green-500 text-white hover:bg-green-600 border-green-500'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-300'
      }`}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.target.style.backgroundColor = '#22b41e';
          e.target.style.color = 'white';
          e.target.style.fontWeight = '500';
          e.target.style.fontSize = '14px';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.target.style.backgroundColor = 'white';
          e.target.style.color = '#374151';
          e.target.style.fontWeight = 'normal';
          e.target.style.fontSize = '12px';
        }
      }}
    >
      {time}
    </Button>
  );
};

const DayColumn = ({ day, date, slots, onSlotSelect }) => (
  <div className="text-center min-w-[70px] flex-shrink-0">
    <h4 className="text-sm font-medium text-gray-700 mb-1">{day}</h4>
    <div className="text-xs text-gray-500 mb-2">{date}</div>
    <div className="space-y-1">
      {slots.map((slot, index) => (
        <TimeSlot
          key={index}
          time={slot.time}
          available={slot.available}
          isSelected={slot.isSelected}
        />
      ))}
    </div>
  </div>
);

export default function AvailabilityPanel({ teacher }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  const weekDays = [
    { day: 'Sun', date: '12' },
    { day: 'Mon', date: '13' },
    { day: 'Tue', date: '14' },
    { day: 'Wed', date: '15' },
    { day: 'Thu', date: '16' }
  ];

  const sampleSlots = [
    { time: '08:00', available: true, isSelected: false },
    { time: '08:00', available: false, isSelected: false },
    { time: '08:00', available: true, isSelected: false },
    { time: '08:00', available: false, isSelected: false }
  ];

  return (
    <Card className="w-80 shadow-lg border">
      {!showCalendar ? (
        <div className="p-4 space-y-4">
            <div className="relative group cursor-pointer">
                <img
                    src={teacher.videoThumbnail || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"}
                    alt="Video thumbnail"
                    className="w-full h-48 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                    <PlayCircle className="h-12 w-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
            <div className="text-center text-sm text-gray-600 mb-2">
                Your Time Zone Delhi(India) 3:00
            </div>
            <div className="text-center text-lg font-semibold text-gray-800 mb-1">
                {teacher.name}
            </div>
            <div className="text-center">
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    Trial Lesson ▼
                </Button>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                <ChevronLeft className="h-4 w-4" />
                <span>12 - 18</span>
                <span>March, 2021 ▼</span>
                <ChevronRight className="h-4 w-4" />
            </div>
            <button
                className="w-full text-white px-4 py-2 rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--color-website-green)',
                  fontWeight: 400
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--color-website-green-hover)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--color-website-green)';
                }}
                onClick={() => setShowCalendar(true)}
            >
                View full schedule
            </button>
        </div>
      ) : (
        <>
            <CardHeader className="pb-3">
                <div className="relative group cursor-pointer mb-4">
                    <img
                        src={teacher.videoThumbnail || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop"}
                        alt="Video thumbnail"
                        className="w-full h-32 rounded-lg object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                        <PlayCircle className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
                <div className="text-center text-sm text-gray-600 mb-2">
                    Your Time Zone Delhi(India) 3:00
                </div>
                <CardTitle className="text-center text-lg font-semibold text-gray-800">
                    {teacher.name}
                </CardTitle>
                <div className="text-center">
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                        Trial Lesson ▼
                    </Button>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                    <ChevronLeft className="h-4 w-4" />
                    <span>12 - 18</span>
                    <span>March, 2021 ▼</span>
                    <ChevronRight className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-max">
                        {weekDays.map((dayInfo, index) => (
                            <DayColumn
                                key={index}
                                day={dayInfo.day}
                                date={dayInfo.date}
                                slots={sampleSlots}
                            />
                        ))}
                    </div>
                </div>

                {/* Custom Time Section */}
                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Time</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="text-xs text-gray-600">Select Date</label>
                            <Button variant="outline" className="w-full justify-start text-gray-400">
                                📅 Select Date
                            </Button>
                        </div>
                        <div>
                            <label className="text-xs text-gray-600">Select Time</label>
                            <Button variant="outline" className="w-full justify-start text-gray-400">
                                🕐 Select Time
                            </Button>
                        </div>
                    </div>
                    <button 
                      className="w-full text-white px-4 py-2 rounded transition-colors"
                      style={{ 
                        backgroundColor: 'var(--color-website-green)',
                        fontWeight: 400
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'var(--color-website-green-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'var(--color-website-green)';
                      }}
                    >
                        Continue To Payment
                    </button>
                </div>
            </CardContent>
        </>
      )}
    </Card>
  );
}