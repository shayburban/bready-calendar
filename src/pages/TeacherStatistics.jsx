import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Info,
  Search,
  X,
  ChevronDown,
  CalendarDays,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const DESC =
  'Lorem ipsum dol amet, consec tetur adipiscing elit.';

const STAT_CARDS = {
  month: [
    { title: 'Total Trial Lessons', value: 20, suffix: '$' },
    { title: 'Total Hours Booked For Teachers', value: 20, suffix: 'Hrs.' },
    { title: 'Total Meetings With Students', value: 20, suffix: 'Hrs.' },
    { title: 'Refund', value: 20, suffix: '$' },
    { title: 'Total Students Booked', value: 20, suffix: '' },
    { title: 'Total New Students', value: 20, suffix: '' },
  ],
  week: [
    { title: 'Total Trial Lessons', value: 6, suffix: '$' },
    { title: 'Total Hours Booked For Teachers', value: 6, suffix: 'Hrs.' },
    { title: 'Total Meetings With Students', value: 6, suffix: 'Hrs.' },
    { title: 'Refund', value: 2, suffix: '$' },
    { title: 'Total Students Booked', value: 6, suffix: '' },
    { title: 'Total New Students', value: 2, suffix: '' },
  ],
  entire: [
    { title: 'Total Trial Lessons', value: 240, suffix: '$' },
    { title: 'Total Hours Booked For Teachers', value: 240, suffix: 'Hrs.' },
    { title: 'Total Meetings With Students', value: 240, suffix: 'Hrs.' },
    { title: 'Refund', value: 35, suffix: '$' },
    { title: 'Total Students Booked', value: 240, suffix: '' },
    { title: 'Total New Students', value: 56, suffix: '' },
  ],
};

const FILTER_OPTIONS = [
  'Subject',
  'Specialization',
  'Exam',
  'Board',
  'Payment',
  'Bookings',
  'Availability',
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const LEGENDS = [
  { label: 'Legend 1', color: 'bg-blue-500' },
  { label: 'Legend 2', color: 'bg-green-500' },
  { label: 'Legend 3', color: 'bg-orange-400' },
  { label: 'Legend 4', color: 'bg-pink-400' },
  { label: 'Legend 5', color: 'bg-red-500' },
];

function FilterChip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded text-sm text-gray-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-gray-700 leading-none"
        aria-label={`Remove ${label}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function StatCardsGrid({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {cards.map((c, i) => (
        <Card key={i} className="p-4 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {c.title}
          </h3>
          <p className="text-xs text-gray-500 mb-3 flex-1">{DESC}</p>
          <p className="text-gray-700">
            <span className="text-xl font-bold text-blue-600">{c.value}</span>
            {c.suffix ? <span className="ml-1">{c.suffix}</span> : null}
          </p>
        </Card>
      ))}
    </div>
  );
}

function FilterPanel() {
  const [filterSelections, setFilterSelections] = useState({
    Subject: true,
    Specialization: false,
    Exam: false,
    Board: false,
    Payment: false,
    Bookings: false,
    Availability: false,
  });
  const [filterSearch, setFilterSearch] = useState('');
  const [level, setLevel] = useState('');
  const [chips, setChips] = useState(['City', 'Country']);
  const [studentChips, setStudentChips] = useState(['Aman']);
  const [studentSearch, setStudentSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [untilDate, setUntilDate] = useState('');

  const filteredOptions = useMemo(
    () =>
      FILTER_OPTIONS.filter((o) =>
        o.toLowerCase().includes(filterSearch.toLowerCase())
      ),
    [filterSearch]
  );

  const addStudentChip = (e) => {
    if (e.key === 'Enter' && studentSearch.trim()) {
      setStudentChips([...studentChips, studentSearch.trim()]);
      setStudentSearch('');
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Label className="text-sm font-medium text-gray-700 mb-0">
          Filter by
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="w-5 h-5 rounded-full border border-gray-400 text-gray-500 text-xs flex items-center justify-center hover:bg-gray-100"
              >
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              Filter statistics by subject, student, and date range.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>Select Filter</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="px-4 py-3 border-b">
            <h4 className="font-semibold">Select Filter</h4>
          </div>
          <div className="p-3 space-y-3 max-h-80 overflow-auto">
            <Input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search"
              className="h-9"
            />
            {filteredOptions.map((opt) => (
              <div key={opt} className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <Checkbox
                    checked={!!filterSelections[opt]}
                    onCheckedChange={(val) =>
                      setFilterSelections({
                        ...filterSelections,
                        [opt]: !!val,
                      })
                    }
                  />
                  <span>{opt}</span>
                </label>
                {opt === 'Subject' && filterSelections.Subject && (
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((label, i) => (
            <FilterChip
              key={`${label}-${i}`}
              label={label}
              onRemove={() => setChips(chips.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}

      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          onKeyDown={addStudentChip}
          placeholder="Search a student"
          className="pl-9"
        />
      </div>

      {studentChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {studentChips.map((label, i) => (
            <FilterChip
              key={`${label}-${i}`}
              label={label}
              onRemove={() =>
                setStudentChips(studentChips.filter((_, idx) => idx !== i))
              }
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div>
          <Label className="text-sm mb-1 block">From</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Label className="text-sm mb-1 block">Until</Label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="date"
              value={untilDate}
              onChange={(e) => setUntilDate(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="secondary">Set Period</Button>
        <Button variant="outline">Entire Time</Button>
      </div>
    </div>
  );
}

function GraphPanel() {
  const [graphTab, setGraphTab] = useState('month');
  const [activeMonth, setActiveMonth] = useState(0);
  const [activeDay, setActiveDay] = useState(3);

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div>
      <Tabs value={graphTab} onValueChange={setGraphTab}>
        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
          <TabsTrigger
            value="month"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Month
          </TabsTrigger>
          <TabsTrigger
            value="week"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Week
          </TabsTrigger>
          <TabsTrigger
            value="entire"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Entire Time
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-6">
        <div className="flex justify-between text-sm font-bold text-gray-700">
          {MONTHS.map((m, i) => (
            <span key={m} className={i === activeMonth ? 'text-blue-600' : ''}>
              {m}
            </span>
          ))}
        </div>
        <div className="flex justify-between mt-2 gap-1">
          {MONTHS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveMonth(i)}
              className={`flex-1 h-2 rounded ${
                i === activeMonth ? 'bg-blue-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              aria-label={`Select ${MONTHS[i]}`}
            />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-10 gap-2">
          {days.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`aspect-square rounded flex items-center justify-center text-sm border transition-colors ${
                d === activeDay
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatisticsChart() {
  return (
    <Card className="p-4 shadow-sm mt-6">
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-700 hover:text-blue-600"
            >
              <ChevronDown className="w-4 h-4" />
              Legend
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="end">
            <ul className="space-y-2">
              {LEGENDS.map((l) => (
                <li key={l.label} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${l.color}`}
                  />
                  <span>{l.label}</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-4 h-64 bg-gradient-to-b from-blue-50 to-white border rounded relative overflow-hidden">
        <svg
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <polyline
            points="0,150 40,120 80,130 120,90 160,110 200,70 240,85 280,50 320,65 360,40 400,55"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
          />
          <polyline
            points="0,170 40,160 80,140 120,155 160,130 200,140 240,115 280,125 320,100 360,110 400,90"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2"
          />
          <polyline
            points="0,180 40,175 80,165 120,170 160,160 200,165 240,155 280,160 320,145 360,150 400,140"
            fill="none"
            stroke="#fb923c"
            strokeWidth="2"
          />
        </svg>
      </div>
    </Card>
  );
}

export default function TeacherStatistics() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('month');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Teacher Statistics</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Teacher Statistics</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="stats" />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Statistics</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
            <TabsTrigger
              value="month"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
            >
              Month
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
            >
              Week
            </TabsTrigger>
            <TabsTrigger
              value="entire"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
            >
              Entire Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value="month" className="mt-0">
            <StatCardsGrid cards={STAT_CARDS.month} />
          </TabsContent>
          <TabsContent value="week" className="mt-0">
            <StatCardsGrid cards={STAT_CARDS.week} />
          </TabsContent>
          <TabsContent value="entire" className="mt-0">
            <StatCardsGrid cards={STAT_CARDS.entire} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            Load More
          </Button>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">
          Activity Of Statistics
        </h2>

        <Card className="p-4 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <FilterPanel />
            </div>
            <div className="lg:col-span-8">
              <GraphPanel />
            </div>
          </div>
        </Card>

        <StatisticsChart />
      </div>
    </div>
  );
}
