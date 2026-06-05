
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Info
} from 'lucide-react';
import ResponsiveCalendarSidebar from '../components/calendar/ResponsiveCalendarSidebar';
import WeeklyCalendarGrid from '../components/calendar/WeeklyCalendarGrid';
import EventModal from '../components/calendar/EventModal';
import AvailabilityModal from '../components/calendar/AvailabilityModal';
import AddNewBookingOrAvailabilityModal from '../components/calendar/AddNewBookingOrAvailabilityModal';
import SyncedEventsModal from '../components/calendar/SyncedEventsModal';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { goToCalendarView } from '@/lib/calendarViewNavigation';
import {
  applySaveAvailability,
  loadAvailabilitySlots,
  persistAvailabilitySlots,
  AVAILABILITY_STORAGE_KEY,
} from '@/lib/availabilityStore';

export default function TeacherCalendarWeekly() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Week'); // Set default view to Week
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showSyncedModal, setShowSyncedModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState(['not-reviewed', 'completed', 'cancelled']);
  // Hydrated from the same localStorage-backed store the Monthly page
  // uses, so saving from either calendar updates a single source of
  // truth. See @/lib/availabilityStore.
  const [savedAvailabilitySlots, setSavedAvailabilitySlots] = useState(() =>
    loadAvailabilitySlots()
  );
  // Mirror Monthly's sidebar wiring so the Set Availability (T) tab is
  // actually controllable on Weekly too. Without these, primaryRangeValue
  // is undefined → reviewRanges = [] → Save Dates is permanently disabled.
  const [extraRows, setExtraRows] = useState([]);
  const [primaryRange, setPrimaryRange] = useState(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return { startDate: t, endDate: t };
  });
  const [activeWeekdays, setActiveWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [noEndDate, setNoEndDate] = useState(false);

  // Reset the Set Availability form's parent-owned date ranges (called by the
  // sidebar after a successful Save or on Cancel). Mirrors Monthly.
  const resetAvailabilityForm = () => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    setPrimaryRange({ startDate: t, endDate: t });
    setExtraRows([]);
    setActiveWeekdays([0, 1, 2, 3, 4, 5, 6]);
  };

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEvents();
  }, []);

  const handleSaveAvailability = (slots, mode) => {
    setSavedAvailabilitySlots((prev) => {
      const next = applySaveAvailability(prev, slots, mode);
      persistAvailabilitySlots(next);
      return next;
    });
  };

  // Inline YYYY-MM-DD formatter so we don't pull date-fns into this page
  // just for one slot-key conversion. Mirrors Monthly's helper.
  const toYMD = (input) => {
    if (!input) return null;
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Tasks 2 & 3 — Reactive grid sync on popup-driven delete/update.
  // Identical contract to Monthly: identifies the existing slot via
  // (event.dateString, event.time) and either drops it or replaces it
  // with the new (nextDate, nextStartTime, nextEndTime) tuple. The
  // localStorage store is shared, so writing here is enough for the
  // Weekly grid to re-render reactively.
  const handleAvailabilityChanged = ({ type, event, nextDate, nextStartTime, nextEndTime }) => {
    if (!event) return;
    const prevYMD = toYMD(event.dateString);
    const [prevStart, prevEnd] = (event.time || '').split(' - ');
    if (!prevYMD || !prevStart || !prevEnd) return;
    setSavedAvailabilitySlots((prev) => {
      const remaining = prev.filter(
        (s) => !(s.date === prevYMD && s.startTime === prevStart && s.endTime === prevEnd)
      );
      if (type === 'delete') {
        persistAvailabilitySlots(remaining);
        return remaining;
      }
      if (type === 'update') {
        const newYMD = toYMD(nextDate);
        if (!newYMD || !nextStartTime || !nextEndTime) {
          persistAvailabilitySlots(remaining);
          return remaining;
        }
        const next = applySaveAvailability(
          remaining,
          [{ date: newYMD, startTime: nextStartTime, endTime: nextEndTime }],
          'open'
        );
        persistAvailabilitySlots(next);
        return next;
      }
      return prev;
    });
  };

  const handlePrimaryRangeChange = (rangeData) => {
    // Task 2 — explicit full-clear from the sidebar's first-row delete
    // fallback. Accept BOTH-null but still reject partial-null so
    // mid-edit picker states never leak into the persisted range.
    if (
      rangeData &&
      rangeData.startDate === null &&
      rangeData.endDate === null
    ) {
      setPrimaryRange({ startDate: null, endDate: null });
      return;
    }
    if (!rangeData?.startDate || !rangeData?.endDate) return;
    const ns = new Date(rangeData.startDate); ns.setHours(0, 0, 0, 0);
    const ne = new Date(rangeData.endDate); ne.setHours(0, 0, 0, 0);
    setPrimaryRange((prev) => {
      if (prev?.startDate && prev?.endDate) {
        const ps = new Date(prev.startDate); ps.setHours(0, 0, 0, 0);
        const pe = new Date(prev.endDate); pe.setHours(0, 0, 0, 0);
        if (ps.getTime() === ns.getTime() && pe.getTime() === ne.getTime()) return prev;
      }
      return { startDate: ns, endDate: ne };
    });
  };

  const updateExtraRowRange = (id, range) => {
    setExtraRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...range } : r)));
  };

  const handleNoEndDateChange = (newValue) => {
    setNoEndDate(newValue);
    if (newValue) return;
    setPrimaryRange((prev) => {
      if (!prev || !prev.startDate || !prev.endDate) return prev;
      const s = new Date(prev.startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(prev.endDate); e.setHours(0, 0, 0, 0);
      if (s.getTime() > e.getTime()) {
        return { startDate: s, endDate: s };
      }
      return prev;
    });
  };

  // Pick up cross-tab writes (e.g. Monthly page in another window) and
  // also re-hydrate when the user navigates back from Monthly via the
  // top-level view switcher (full page reload, but the storage event
  // handler is harmless and keeps state coherent if a second tab edits).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== AVAILABILITY_STORAGE_KEY) return;
      setSavedAvailabilitySlots(loadAvailabilitySlots());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    if (event.type === 'synced') {
        setShowSyncedModal(true);
    } else if (
      event.type === 'availability' ||
      event.type === 'booked' ||
      (event.type === 'cancelled' && (event.role === 'S' || event.role === 'T')) ||
      (event.type === 'not-reviewed' && (event.role === 'T' || event.role === 'S')) ||
      (event.type === 'waiting' && (event.role === 'T' || event.role === 'S')) ||
      (event.type === 'completed' && (event.role === 'T' || event.role === 'S'))
    ) {
        setShowAvailabilityModal(true);
    } else {
        setShowEventModal(true);
    }
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

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

      {/* Navigation Tabs - Refactored to use TeacherPageTabs */}
      <TeacherPageTabs activeTabValue="calendar" />

      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          <ResponsiveCalendarSidebar
            view={view}
            setView={setView}
            onLegendFilterChange={setActiveFilters}
            extraRows={extraRows}
            onAddExtraRow={() =>
              setExtraRows((prev) => [
                ...prev,
                { id: Math.max(0, ...prev.map((r) => r.id)) + 1 },
              ])
            }
            onRemoveExtraRow={(id) =>
              setExtraRows((prev) => prev.filter((r) => r.id !== id))
            }
            onUpdateExtraRow={updateExtraRowRange}
            primaryRangeValue={primaryRange}
            onPrimaryRangeChange={handlePrimaryRangeChange}
            onActiveWeekdaysChange={setActiveWeekdays}
            onSaveAvailability={handleSaveAvailability}
            onNoEndDateChange={handleNoEndDateChange}
            onResetAvailabilityForm={resetAvailabilityForm}
          />

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
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center"><span className="text-white text-xs font-bold">S</span></div>
                  <span className="text-sm">Skype Call</span>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center"><span className="text-white text-xs font-bold">G</span></div>
                   <span className="text-sm">Google Meet</span>
                </div>
                <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center"><span className="text-white text-xs font-bold">Z</span></div>
                   <span className="text-sm">Zoom Meeting</span>
                </div>
              </div>

              {/* Calendar Navigation */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">Today</Button>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-semibold">{monthYear}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center space-x-4 gap-2">
                  <Button variant="ghost" size="sm"><Maximize className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                  <Select
                    value={view}
                    onValueChange={(newView) => {
                      // Same source as the sidebar dropdown — see
                      // src/lib/calendarViewNavigation.js. Both
                      // dropdowns now behave identically.
                      goToCalendarView(newView);
                      setView(newView);
                    }}
                  >
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent position="popper" sideOffset={4}>
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

            {/* Weekly Calendar Grid */}
            <div className="p-1 lg:p-6">
              <WeeklyCalendarGrid
                currentDate={currentDate}
                onEventClick={handleEventClick}
                onEmptyClick={() => setShowAddModal(true)}
                activeFilters={activeFilters}
                savedAvailabilitySlots={savedAvailabilitySlots}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EventModal
        event={selectedEvent}
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
      />
      <AvailabilityModal
        event={selectedEvent}
        isOpen={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        savedAvailabilitySlots={savedAvailabilitySlots}
        onAvailabilityChanged={handleAvailabilityChanged}
      />
      <SyncedEventsModal
        event={selectedEvent}
        isOpen={showSyncedModal}
        onClose={() => setShowSyncedModal(false)}
      />
      <AddNewBookingOrAvailabilityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}
