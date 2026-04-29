
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Booking } from '@/api/entities';
import { Availability } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
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
import AddNewBookingOrAvailabilityModal from '../components/calendar/AddNewBookingOrAvailabilityModal';
import SyncedEventsModal from '../components/calendar/SyncedEventsModal';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { sampleEvents } from '@/data/sampleEvents';

// Visual mapping for the in-calendar event chips (NOT the popup cards).
// Matches the dot colors from the legend and the design mockup.
const TYPE_DOT_COLOR = {
  availability: 'bg-green-600',
  booked: 'bg-orange-500',
  'not-reviewed': 'bg-red-600',
  synced: 'bg-indigo-600',
  waiting: 'bg-pink-300',
  cancelled: 'bg-gray-800',
  completed: 'bg-gray-800',
};

// Per-type, per-role label used to build the hover tooltip breakdown.
const TYPE_ROLE_LABEL = {
  availability: { T: 'My Availability', S: 'Other Availability' },
  booked: { T: 'Bookings', S: 'Bookings' },
  'not-reviewed': { T: 'Not Reviewed', S: 'Not Reviewed' },
  waiting: { T: 'Waiting', S: 'Waiting' },
  cancelled: { T: 'Cancelled', S: 'Cancelled' },
  completed: { T: 'Completed', S: 'Completed' },
  synced: { '-': 'Synced Calendar Event' },
};

// Header label for the popover picker — "Select X event".
const TYPE_HEADER_LABEL = {
  availability: 'Availability',
  booked: 'Booked',
  'not-reviewed': 'Not Reviewed',
  synced: 'Synced Calendar Events',
  waiting: 'Waiting For Confirmation',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

// "Show More Months" caps total months at 36 and adds 2 per click.
const MAX_TOTAL_MONTHS = 36;
const MONTHS_STEP = 2;

// Lightweight popover that lists every event in a chip's bundle so the user
// can pick which exact card to open. Shown when the chip groups 2+ events
// of the same type, OR when Booked + Waiting share a day in mixed mode.
// Each row's dot is colored from the event's own type so mixed pickers stay
// visually differentiated. Pass `header` to override the default
// "Select <headerLabel> event" template (used by the mixed picker).
function EventPickerPopover({ chip, headerLabel, header, items, onSelect }) {
  const [open, setOpen] = useState(false);
  // Always render rows in start-time order (earliest first), regardless of
  // how the caller assembled `items`.
  const sortedItems = [...items].sort((a, b) =>
    ((a.time || '').split(' - ')[0]).localeCompare(
      (b.time || '').split(' - ')[0]
    )
  );
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{chip}</PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="px-3 py-2 border-b font-semibold text-sm text-gray-800">
          {header || `Select ${headerLabel} event`}
        </div>
        <div className="py-1">
          {sortedItems.map((e) => {
            const rowDotColor = TYPE_DOT_COLOR[e.type] || 'bg-gray-400';
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => { setOpen(false); onSelect(e); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50"
              >
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${rowDotColor}`} />
                {e.role && (
                  <span className="font-semibold text-gray-700 w-7 flex-shrink-0">({e.role})</span>
                )}
                <span className="text-gray-700 flex-shrink-0">{e.time}</span>
                {e.reschedule && (
                  <span className="ml-auto text-[10px] text-orange-600 font-semibold flex-shrink-0">
                    {e.type === 'booked' ? 'You Requested a Change' : 'Reschedule'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Build the hover-tooltip text from the role breakdown of one type's events.
// e.g. for 3 avail T + 2 avail S → "3 My Availability (T), 2 Other Availability (S)"
const buildEventTooltip = (events, type) => {
  const byRole = events.reduce((acc, e) => {
    const role = e.role || '-';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});
  const labels = TYPE_ROLE_LABEL[type] || {};
  return Object.entries(byRole)
    .map(([role, n]) => {
      const label = labels[role] || type;
      const suffix = role === '-' ? '' : ` (${role})`;
      return `${n} ${label}${suffix}`;
    })
    .join(', ');
};

export default function TeacherCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('Month');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showSyncedModal, setShowSyncedModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAddDate, setSelectedAddDate] = useState('');
  // Active legend filter — only these 3 types are toggleable from the sidebar.
  // All other types are always visible regardless of this list.
  const [activeFilters, setActiveFilters] = useState(['not-reviewed', 'completed', 'cancelled']);
  // Number of additional months loaded beyond the navigated `currentDate`.
  // Default is 1 so the page renders exactly 2 months stacked vertically.
  // Click "Show More Months" to load 2 more (capped at MAX_TOTAL_MONTHS - 1).
  const [extraMonthsLoaded, setExtraMonthsLoaded] = useState(1);
  // Extra availability ranges (rows 2..N) from the sidebar. The first row
  // is the *primary* range and lives in `primaryRange` below — that one is
  // bidirectionally linked with the calendar's drag handles.
  const [availabilityRanges, setAvailabilityRanges] = useState([]);
  // Single source of truth for the primary blue range. Drag handles write
  // directly here; the sidebar's first DateRangePicker is controlled by
  // this value via the `primaryRangeValue` prop.
  const [primaryRange, setPrimaryRange] = useState(() => {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return { startDate: t, endDate: t };
  });
  const [dragMode, setDragMode] = useState(null); // 'start' | 'end' | null
  // Active weekday filter from the "Advanced date selection" sidebar dropdown.
  // Indices follow Date#getDay(): 0=Sun … 6=Sat. Default = all days included.
  const [activeWeekdays, setActiveWeekdays] = useState([0, 1, 2, 3, 4, 5, 6]);

  const openAddModalForDay = (dayNumber, monthDate) => {
    const ref = monthDate || currentDate;
    const y = ref.getFullYear();
    const m = String(ref.getMonth() + 1).padStart(2, '0');
    const d = String(dayNumber).padStart(2, '0');
    setSelectedAddDate(`${y}-${m}-${d}`);
    setShowAddModal(true);
  };

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
    setExtraMonthsLoaded(1);
  };

  const handleShowMoreMonths = () => {
    setExtraMonthsLoaded((prev) => Math.min(prev + MONTHS_STEP, MAX_TOTAL_MONTHS - 1));
  };

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days for the given monthDate (defaults to currentDate).
  // Discrete-month logic: cells outside the month are blank placeholders, not
  // ghost dates from the prev/next month. The grid is trimmed to only the
  // weeks that contain at least one current-month date.
  const generateCalendarDays = (monthDate) => {
    const ref = monthDate || currentDate;
    const startDate = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const endDate = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    const startDay = startDate.getDay();
    const daysInMonth = endDate.getDate();
    const days = [];

    // Leading blank cells before day 1.
    for (let i = 0; i < startDay; i++) {
      days.push({ isPlaceholder: true });
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getDate() === day &&
                     today.getMonth() === ref.getMonth() &&
                     today.getFullYear() === ref.getFullYear();
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday
      });
    }

    // Trailing blank cells to round out the final partial week. We do NOT
    // pad to 42 — extra empty rows would just be wasted whitespace.
    const trailing = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < trailing; i++) {
      days.push({ isPlaceholder: true });
    }

    return days;
  };

  // Visual grouping: one chip per type per day (across roles).
  // Roles are surfaced via the hover tooltip, not separate chips.
  const getEventsByTypeForDay = (dayEvents) => {
    const grouped = {};
    dayEvents.forEach((event) => {
      if (!grouped[event.type]) grouped[event.type] = [];
      grouped[event.type].push(event);
    });
    return grouped;
  };

  // Open the right modal for a single picked event. The popover picker calls
  // this when a row is selected; chips with only one event call it directly.
  // `monthDate` lets each rendered month pin events to its own year/month
  // (defaults to the navigated currentDate for the first/primary grid).
  const openEventModal = (event, monthDate) => {
    const ref = monthDate || currentDate;
    const eventDate = new Date(ref.getFullYear(), ref.getMonth(), event.date);
    const allDatesForCategory = sampleEvents
      .filter((e) => e.type === event.type && e.role === event.role)
      .map((e) => new Date(ref.getFullYear(), ref.getMonth(), e.date).toISOString());
    const uniqueDates = [...new Set(allDatesForCategory)];

    setSelectedEvent({
      ...event,
      dateString: eventDate.toISOString(),
      availableDatesForCategory: uniqueDates,
    });

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

  // Renders a "row group" inside a day cell for related event types that share
  // a mixed-mode layout. Used twice:
  //   - future group: ['booked', 'waiting']
  //   - past group:   ['cancelled', 'completed', 'not-reviewed']
  // Single-category mode (only one type from the group present):
  //   each event = 1 row showing the full time range. If N <= 3, show all
  //   N rows. If N >= 4, show 2 rows + "+X more" picker (X = N - 2). The
  //   picker lists only the hidden events.
  // Mixed mode (2+ types from the group present):
  //   max 2 rows total, one per type (the 2 types whose earliest event is
  //   earliest overall), labeled "From <start>". Each chip is independent:
  //   if its type has more than 1 event, the chip shows a "+N" badge (N =
  //   typeCount - 1) and clicking opens a picker that contains ONLY that
  //   type's events; otherwise the chip opens the modal directly.
  const renderEventGroup = (groupTypes, eventsByType, monthDate) => {
    const activeTypes = groupTypes.filter((t) => (eventsByType[t] || []).length > 0);
    if (activeTypes.length === 0) return null;

    const sortByStart = (arr) =>
      [...arr].sort((a, b) =>
        ((a.time || '').split(' - ')[0]).localeCompare(
          (b.time || '').split(' - ')[0]
        )
      );
    const startTime = (e) => (e.time || '').split(' - ')[0];
    const eventTooltip = (e) => {
      const labels = TYPE_ROLE_LABEL[e.type] || {};
      const label = labels[e.role || '-'] || e.type;
      const suffix = e.role && e.role !== '-' ? ` (${e.role})` : '';
      return `${label}${suffix}`;
    };
    const renderDot = (type) => {
      const dotColor = TYPE_DOT_COLOR[type] || 'bg-gray-400';
      if (type === 'completed') {
        return (
          <span className="text-gray-800 font-bold leading-none text-[12px] w-3 flex justify-center flex-shrink-0">$</span>
        );
      }
      return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />;
    };

    // ----- MIXED MODE -----
    if (activeTypes.length > 1) {
      const typesByEarliest = [...activeTypes].sort((a, b) =>
        startTime(sortByStart(eventsByType[a])[0]).localeCompare(
          startTime(sortByStart(eventsByType[b])[0])
        )
      );
      // One row per distinct type so the user can see every event type at
      // a glance (e.g. April 8 has not-reviewed + completed + cancelled).
      const visibleTypes = typesByEarliest;

      return (
        <div className="space-y-1">
          {visibleTypes.map((type) => {
            const typeEvents = eventsByType[type];
            const earliestEvent = sortByStart(typeEvents)[0];
            const typeCount = typeEvents.length;
            const hiddenForType = typeCount - 1;
            const headerLabel = TYPE_HEADER_LABEL[type] || type;
            const tooltip = typeCount > 1
              ? buildEventTooltip(typeEvents, type)
              : eventTooltip(earliestEvent);
            const badge = hiddenForType > 0 ? `+${hiddenForType}` : null;
            const chipInner = (
              <>
                {renderDot(type)}
                <span className="truncate flex-1 min-w-0">From {startTime(earliestEvent)}</span>
                {badge && (
                  <span className="bg-white border border-gray-300 text-gray-600 rounded-full text-[9px] leading-none px-1 min-w-[1rem] h-4 flex items-center justify-center flex-shrink-0">
                    {badge}
                  </span>
                )}
              </>
            );
            // typeCount === 1: chip opens that single event's modal directly.
            if (typeCount === 1) {
              return (
                <div
                  key={type}
                  title={tooltip}
                  onClick={() => openEventModal(earliestEvent, monthDate)}
                  className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px] text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {chipInner}
                </div>
              );
            }
            // typeCount > 1: chip opens picker scoped to ONLY this type.
            const chipNode = (
              <div
                title={tooltip}
                className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px] text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {chipInner}
              </div>
            );
            return (
              <EventPickerPopover
                key={type}
                chip={chipNode}
                headerLabel={headerLabel}
                items={typeEvents}
                onSelect={(e) => openEventModal(e, monthDate)}
              />
            );
          })}
        </div>
      );
    }

    // ----- SINGLE CATEGORY -----
    const singleType = activeTypes[0];
    const sortedEvents = sortByStart(eventsByType[singleType]);
    const N = sortedEvents.length;
    const visibleCount = N <= 3 ? N : 2;
    const hidden = N <= 3 ? 0 : N - 2;
    const headerLabel = TYPE_HEADER_LABEL[singleType] || singleType;

    return (
      <div className="space-y-1">
        {sortedEvents.slice(0, visibleCount).map((e) => (
          <div
            key={e.id}
            title={eventTooltip(e)}
            onClick={() => openEventModal(e, monthDate)}
            className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px] text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            {renderDot(singleType)}
            <span className="truncate flex-1 min-w-0">{e.time}</span>
          </div>
        ))}
        {hidden > 0 && (
          <EventPickerPopover
            chip={
              <div
                title={buildEventTooltip(sortedEvents.slice(visibleCount), singleType)}
                className="flex items-center justify-center bg-white border border-gray-200 rounded px-1.5 py-1 text-[11px] text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                +{hidden} more
              </div>
            }
            headerLabel={headerLabel}
            items={sortedEvents.slice(visibleCount)}
            onSelect={(e) => openEventModal(e, monthDate)}
          />
        )}
      </div>
    );
  };

  // Build the list of months to render (currentDate + extras up to 36 total).
  const totalMonths = Math.min(1 + extraMonthsLoaded, MAX_TOTAL_MONTHS);
  const monthsToRender = Array.from({ length: totalMonths }, (_, i) =>
    new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1)
  );
  const canShowMoreMonths = totalMonths < MAX_TOTAL_MONTHS;

  // Effective availability ranges for the blue overlay: primary range +
  // any extra rows the sidebar emits. Filters out ranges missing endpoints.
  const effectiveAvailabilityRanges = [primaryRange, ...availabilityRanges]
    .filter((r) => r && r.startDate && r.endDate);

  const isDateInAvailabilityRange = (cellDate) => {
    // Apply the "Advanced date selection" weekday filter: a cell only counts
    // as in-range if its weekday is currently checked in the sidebar.
    if (!activeWeekdays.includes(cellDate.getDay())) return false;
    return effectiveAvailabilityRanges.some((r) => {
      const s = new Date(r.startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(r.endDate); e.setHours(0, 0, 0, 0);
      const c = cellDate.getTime();
      return c >= s.getTime() && c <= e.getTime();
    });
  };

  const isPrimaryStartDay = (cellDate) => {
    if (!cellDate || !primaryRange) return false;
    const s = new Date(primaryRange.startDate); s.setHours(0, 0, 0, 0);
    return s.getTime() === cellDate.getTime();
  };
  const isPrimaryEndDay = (cellDate) => {
    if (!cellDate || !primaryRange) return false;
    const e = new Date(primaryRange.endDate); e.setHours(0, 0, 0, 0);
    return e.getTime() === cellDate.getTime();
  };

  // Bidirectional sync: sidebar-row-0 picks call this; drag handles also
  // write here via setPrimaryRange. The guard avoids an infinite re-emit
  // when the value-prop sync echoes the same range back from the picker.
  const handlePrimaryRangeChange = (rangeData) => {
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

  const startDrag = (mode) => {
    if (!primaryRange) return;
    setDragMode(mode);
  };

  // Document-level drag listeners; active only while a handle is held.
  useEffect(() => {
    if (!dragMode) return;
    const handleMove = (e) => {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      const cell = target.closest && target.closest('[data-cell-date]');
      if (!cell) return;
      const ts = parseInt(cell.dataset.cellDate, 10);
      if (Number.isNaN(ts)) return;
      const cur = new Date(ts); cur.setHours(0, 0, 0, 0);
      // Earliest allowed start/end is today — handles cannot enter the past.
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      setPrimaryRange((prev) => {
        if (!prev) return prev;
        const ps = new Date(prev.startDate); ps.setHours(0, 0, 0, 0);
        const pe = new Date(prev.endDate); pe.setHours(0, 0, 0, 0);
        const startMs = ps.getTime();
        const endMs = pe.getTime();
        if (dragMode === 'start') {
          if (cur.getTime() < todayMs) return prev;
          if (cur.getTime() > endMs) return prev;
          if (cur.getTime() === startMs) return prev;
          return { startDate: cur, endDate: pe };
        }
        if (cur.getTime() < startMs) return prev;
        if (cur.getTime() < todayMs) return prev;
        if (cur.getTime() === endMs) return prev;
        return { startDate: ps, endDate: cur };
      });
    };
    const handleUp = () => setDragMode(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [dragMode]);

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
          
          <CalendarSidebar
            view={view}
            setView={setView}
            onLegendFilterChange={setActiveFilters}
            onAvailabilityRangesChange={setAvailabilityRanges}
            primaryRangeValue={primaryRange}
            onPrimaryRangeChange={handlePrimaryRangeChange}
            onActiveWeekdaysChange={setActiveWeekdays}
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
              {monthsToRender.map((monthDate, monthIdx) => {
                const isFirstMonth = monthIdx === 0;
                const monthLabel = monthDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric'
                });
                const days = generateCalendarDays(monthDate);

                return (
                  <div key={monthIdx} className={isFirstMonth ? '' : 'mt-10 pt-6 border-t'}>
                    {!isFirstMonth && (
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{monthLabel}</h3>
                    )}
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
                        if (day.isPlaceholder) {
                          return (
                            <div
                              key={index}
                              className="min-h-[120px] border-r border-b bg-gray-50"
                              aria-hidden="true"
                            />
                          );
                        }
                        const FILTERABLE_TYPES = ['not-reviewed', 'completed', 'cancelled'];
                        const dayEvents = events.filter(event =>
                          event.date === day.date &&
                          day.isCurrentMonth &&
                          (!FILTERABLE_TYPES.includes(event.type) || activeFilters.includes(event.type))
                        );
                        const eventsByType = getEventsByTypeForDay(dayEvents);
                        // Highlight every cell whose full date (year+month+day)
                        // falls inside any range from the sidebar's "Set
                        // Availability" tab. Defaults to today when no range
                        // has been picked yet.
                        const cellDate = day.isCurrentMonth
                          ? new Date(monthDate.getFullYear(), monthDate.getMonth(), day.date)
                          : null;
                        const isAvailabilityDay =
                          !!cellDate && isDateInAvailabilityRange(cellDate);
                        const showStartHandle = isPrimaryStartDay(cellDate);
                        const showEndHandle = isPrimaryEndDay(cellDate);

                        return (
                          <div
                            key={index}
                            data-cell-date={cellDate ? cellDate.getTime() : undefined}
                            className={`
                              min-h-[120px] border-r border-b p-2 relative group
                              ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                              ${day.isToday ? 'bg-blue-50' : ''}
                              ${isAvailabilityDay ? 'bg-blue-50 ring-1 ring-inset ring-blue-600 z-[1]' : ''}
                              ${dragMode ? 'select-none' : ''}
                            `}
                          >
                            {showStartHandle && (
                              <button
                                type="button"
                                title="Drag to change start date"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag('start'); }}
                                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-ew-resize shadow hover:bg-blue-700"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {showEndHandle && (
                              <button
                                type="button"
                                title="Drag to change end date"
                                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDrag('end'); }}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center cursor-ew-resize shadow hover:bg-blue-700"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
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
                                title="Add New Booking Or Availability"
                                onClick={(e) => { e.stopPropagation(); openAddModalForDay(day.date, monthDate); }}
                                className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-400 hover:bg-gray-500 text-white rounded-full"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            )}

                            {/* Availability + Synced render as dot-only markers at the
                                top-right of the cell (no time, no count). Tooltip and
                                click behavior match the chips below: hover shows the
                                role breakdown, click opens the picker (or modal if 1).
                                Availability sits to the left of Synced. */}
                            {(eventsByType.availability || eventsByType.synced) && (
                              <div className="absolute top-2 right-8 flex items-center gap-1.5 z-10">
                                {['availability', 'synced'].map((type) => {
                                  const typeEvents = eventsByType[type];
                                  if (!typeEvents) return null;
                                  const tooltip = buildEventTooltip(typeEvents, type);
                                  const dotColor = TYPE_DOT_COLOR[type];
                                  const headerLabel = TYPE_HEADER_LABEL[type];

                                  if (typeEvents.length === 1) {
                                    return (
                                      <button
                                        key={type}
                                        type="button"
                                        title={tooltip}
                                        onClick={() => openEventModal(typeEvents[0], monthDate)}
                                        className={`w-3 h-3 rounded-full ${dotColor} hover:ring-2 hover:ring-gray-300 transition cursor-pointer`}
                                      />
                                    );
                                  }

                                  const dotButton = (
                                    <button
                                      type="button"
                                      title={tooltip}
                                      className={`w-3 h-3 rounded-full ${dotColor} hover:ring-2 hover:ring-gray-300 transition cursor-pointer`}
                                    />
                                  );

                                  return (
                                    <EventPickerPopover
                                      key={type}
                                      chip={dotButton}
                                      headerLabel={headerLabel}
                                      items={typeEvents}
                                      onSelect={(e) => openEventModal(e, monthDate)}
                                    />
                                  );
                                })}
                              </div>
                            )}

                            {/* FUTURE group: Booked + Waiting (single or mixed mode). */}
                            {renderEventGroup(['booked', 'waiting'], eventsByType, monthDate)}

                            {/* PAST group: Cancellation Fees + Completed + Not Reviewed
                                (single or mixed mode). Synced & Availability render
                                as top-right dots above. */}
                            {renderEventGroup(['cancelled', 'completed', 'not-reviewed'], eventsByType, monthDate)}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Show More Months Button — appears under the last loaded month
                  and adds 2 more per click, capped at MAX_TOTAL_MONTHS (36). */}
              {canShowMoreMonths && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={handleShowMoreMonths}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    Show More Months
                  </Button>
                </div>
              )}
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
      <SyncedEventsModal
        event={selectedEvent}
        isOpen={showSyncedModal}
        onClose={() => setShowSyncedModal(false)}
      />
      <AddNewBookingOrAvailabilityModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDate={selectedAddDate}
      />
    </div>
  );
}
