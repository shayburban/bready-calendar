
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Booking } from '@/api/entities';
import { Availability } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Maximize,
  Clock,
  MapPin,
  Bell,
  MessageSquare,
  PieChart,
  DollarSign,
  User as UserIcon,
  Home,
  ChevronDown,
  Edit,
  Info,
  Pencil,
  Trash2,
  Mail,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import CalendarSidebar from '../components/calendar/CalendarSidebar';
import EventModal from '../components/calendar/EventModal';
import AvailabilityModal from '../components/calendar/AvailabilityModal';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Enhanced sample events data moved outside the component to prevent re-creation on render
const sampleEvents = [
  { id: 1, date: 10, time: '11:00 - 14:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 5, description: 'Available for booking', timeSlots: ["11:00-12:00", "12:00-13:00", "13:00-14:00"]},
  { id: 2, date: 11, time: '11:00 - 14:00', type: 'booked', role: 'S', color: 'bg-orange-500', student: 'John D.', description: 'Mathematics tutoring session' },
  { id: 3, date: 12, time: '11:00 - 14:00', type: 'synced', color: 'bg-blue-500', description: 'Google Calendar event' },
  { id: 4, date: 15, time: '11:00 - 14:00', type: 'synced', color: 'bg-blue-500', description: 'Synced calendar event' },
  { id: 5, date: 16, time: '11:00 - 14:00', type: 'availability', role: 'T', color: 'bg-green-500', count: 5, description: 'Available slots', timeSlots: ["11:00-12:00", "12:00-13:00", "14:00-15:00", "15:00-16:00"] },
  { id: 6, date: 17, time: '11:00 - 14:00', type: 'not-reviewed', role: 'T', color: 'bg-red-500', student: 'Sarah M.', description: 'Pending review for Physics session' },
  { id: 7, date: 18, time: '11:00 - 14:00', type: 'cancelled', role: 'S', color: 'bg-gray-600', description: 'Session cancelled by student' },
  { id: 8, date: 25, time: '11:00 - 14:00', type: 'cancelled', role: 'T', color: 'bg-gray-600', description: 'Cancelled session by teacher' },
  // Additional events for same days to test grouping
  { id: 9, date: 10, time: '15:00 - 16:00', type: 'availability', role: 'T', color: 'bg-green-500', description: 'Additional availability', timeSlots: ["15:00-16:00"]},
  { id: 10, date: 10, time: '16:00 - 17:00', type: 'availability', role: 'S', color: 'bg-green-500', description: 'My study slot', timeSlots: ["16:00-17:00"]},
  { id: 11, date: 16, time: '15:00 - 16:00', type: 'availability', role: 'T', color: 'bg-green-500', description: 'Afternoon slot', timeSlots: ["15:00-16:00"] },
  // Added a Booked (T) event
  { id: 12, date: 19, time: '15:00 - 16:00', type: 'booked', role: 'T', color: 'bg-orange-500', student: 'Student N.', description: 'Global Booking Test' }
];

export default function TeacherCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        setLoading(true);
        // Simulate fetching user data
        // In a real app, User.me() would likely be an async API call
        const currentUser = await Promise.resolve({ role: 'teacher', full_name: 'Prof. Jane Doe' }); 
        setUser(currentUser);
        
        // Filter events for current teacher if logged in
        if (currentUser?.role === 'teacher') {
          // In a real app, you would fetch events specific to this teacher
          // For now, we'll use the sample events
          setEvents(sampleEvents);
        } else {
          setEvents([]);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setEvents(sampleEvents); // Fallback to sample events if user fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEvents();
  }, []); // Empty dependency array because sampleEvents is now outside and stable.

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days
  const generateCalendarDays = () => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startDate.getDay();
    const daysInMonth = endDate.getDate();
    const days = [];

    // Previous month days
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthEnd.getDate() - i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day && 
                     today.getMonth() === currentDate.getMonth() && 
                     today.getFullYear() === currentDate.getFullYear();
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday
      });
    }

    // Next month days to fill grid
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  // Helper to group events by type and role for a given day
  const getGroupedEventsForDay = (dayEvents) => {
    const grouped = {};
    dayEvents.forEach(event => {
      const key = event.role ? `${event.type}-${event.role}` : event.type;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });
    return grouped;
  };

  // Handler for clicking an event to show the modal
  const handleEventClick = (events) => {
    // For now, take the first event for details, but pass all events of that type
    // to the modal if needed for further display/actions.
    const event = events[0];
    const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
    
    // Find all dates with events of the same type and role
    const allDatesForCategory = sampleEvents
        .filter(e => e.type === event.type && e.role === event.role)
        .map(e => new Date(currentDate.getFullYear(), currentDate.getMonth(), e.date).toISOString());
    
    const uniqueDates = [...new Set(allDatesForCategory)];
    
    setSelectedEvent({
      ...event,
      totalCount: events.length,
      allEvents: events,
      dateString: eventDate.toISOString(),
      availableDatesForCategory: uniqueDates,
    });
    if (
      event.type === 'availability' ||
      event.type === 'booked' ||
      (event.type === 'cancelled' && (event.role === 'S' || event.role === 'T')) ||
      (event.type === 'not-reviewed' && event.role === 'T')
    ) {
        setShowAvailabilityModal(true);
    } else {
        setShowEventModal(true);
    }
  };

  const days = generateCalendarDays();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {user?.full_name ? `${user.full_name}'s Profile` : 'My Profile'}
          </h1>
          <nav className="text-sm opacity-80">
            <Link 
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Website Homepage
            </Link>
            <span className="mx-2">/</span>
            <span>My Calendar</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="calendar" />

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          <CalendarSidebar view={view} setView={setView} />

          {/* Main Calendar Area */}
          <div className="flex-1 bg-white rounded-lg shadow-sm">
            {/* Calendar Header */}
            <div className="p-6 border-b">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-4">
                <div className="flex flex-col lg:flex-row lg:items-center space-y-2 lg:space-y-0 lg:space-x-4">
                  <h2 className="text-xl font-semibold">21:00 (Delhi, India)</h2>
                  <Button variant="outline" size="sm">Change City</Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">Current Price</Button>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Meeting Platform Icons */}
              <div className="flex flex-wrap items-center space-x-4 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-sm">Skype Call</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                  <span className="text-sm">Google Meet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Z</span>
                  </div>
                  <span className="text-sm">Zoom Meeting</span>
                </div>
              </div>

              {/* Calendar Navigation */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">Today</Button>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-semibold">{monthYear}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center space-x-4 gap-2">
                  <Button variant="ghost" size="sm">
                    <Maximize className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Select value={view} onValueChange={setView}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      position="popper" 
                      sideOffset={4} 
                      onCloseAutoFocus={(e) => e.preventDefault()}
                    >
                      <SelectItem value="Month">Month</SelectItem>
                      <SelectItem value="Week">Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm whitespace-nowrap">Synchronize Calendar with</span>
                    <Button variant="outline" size="sm">Google</Button>
                    <Button variant="outline" size="sm">Apple</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-0 mb-4">
                {weekdays.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0 border">
                {days.map((day, index) => {
                  const dayEvents = events.filter(event => event.date === day.date && day.isCurrentMonth);
                  const groupedEvents = getGroupedEventsForDay(dayEvents);

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] border-r border-b p-2 relative group
                        ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                        ${day.isToday ? 'bg-blue-50' : ''}
                        hover:bg-gray-50 cursor-pointer
                      `}
                    >
                      {/* Date Number */}
                      <div className={`
                        text-sm font-medium mb-2
                        ${day.isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                      `}>
                        {day.date}
                      </div>

                      {/* Add Event Button - Only visible on hover */}
                      {day.isCurrentMonth && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400 hover:bg-gray-500 text-white rounded-full"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}

                      {/* Events grouped by type and role */}
                      <div className="space-y-1">
                        {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => {
                          const firstEvent = groupEvents[0];
                          const hasMultiple = groupEvents.length > 1;
                          const roleDisplay = firstEvent.role ? `(${firstEvent.role})` : '';
                          
                          return (
                            <div
                              key={groupKey}
                              className={`
                                text-xs px-2 py-1 rounded text-white cursor-pointer
                                hover:opacity-80 transition-opacity
                                ${firstEvent.color}
                              `}
                              onClick={() => handleEventClick(groupEvents)}
                            >
                              <div className="font-medium flex justify-between items-center">
                                <span>{firstEvent.time}</span>
                                {roleDisplay && <span className="font-bold">{roleDisplay}</span>}
                              </div>
                              {hasMultiple && (
                                <div className="font-bold">
                                  +{groupEvents.length}
                                </div>
                              )}
                              {firstEvent.count && !hasMultiple && (
                                <div>+{firstEvent.count}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Connection indicators */}
                      {day.isCurrentMonth && day.date >= 16 && day.date <= 18 && (
                        <div className="absolute top-2 right-8 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Show More Months Button */}
              <div className="flex justify-center mt-6">
                <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50">
                  Show More Months
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Modals */}
      <EventModal 
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
      <AvailabilityModal
        event={selectedEvent}
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
      />
    </div>
  );
}
