import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Info,
  Search,
  X,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  List,
  Download,
  ChevronDown,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TITLE_OPTIONS = [
  { id: 'booked', label: 'Booked', color: 'bg-orange-400' },
  { id: 'not-reviewed', label: 'Not Reviewed', color: 'bg-red-500' },
  { id: 'availability', label: 'Availability', color: 'bg-green-500' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-600' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-gray-500' },
  { id: 'synced', label: 'Synced Calendar Events', color: 'bg-blue-500' },
  { id: 'waiting', label: 'Waiting For Confirmation', color: 'bg-amber-300' },
];

const COLUMN_OPTIONS = [
  'Name',
  'Type',
  'Date',
  'Time',
  'Service',
  'Referred Students',
  'Duration',
];

const TABS = [
  { value: 'all', label: 'All', badge: 2 },
  { value: 'booking', label: 'Bookings', badge: 2 },
  { value: 'teacher', label: 'As A Teacher', badge: 2 },
  { value: 'student', label: 'As A Student', badge: 2 },
  { value: 'site', label: 'Site.com Messages', badge: 2 },
];

const SAMPLE_ROWS = {
  all: [
    { id: 1, starred: false, read: false, name: 'John Doe', title: 'Waiting For Confirmation (T)', message: 'Lorem Ipsum is simply dummy text of the', date: '15 Aug. 2021', time: '09:00' },
    { id: 2, starred: false, read: true, name: 'John Doe', title: 'Cancelled Before Time Policy (S)', message: 'Sorry to let you know about cancelation', date: '15 Aug. 2021', time: '09:00' },
    { id: 3, starred: true, read: true, name: 'John Doe', title: 'Cancelled After Time Policy', message: 'Get fees', date: '15 Aug. 2021', time: '09:00' },
    { id: 4, starred: false, read: true, name: 'John Doe', title: 'New Booking', message: 'Lorem Ipsum is simply dummy text of the', date: '15 Aug. 2021', time: '09:00' },
    { id: 5, starred: false, read: true, name: 'John Doe', title: 'Payment Deposited', message: 'Student Name deposited payment', date: '15 Aug. 2021', time: '09:00' },
    { id: 6, starred: false, read: true, name: 'John Doe', title: 'Payment Released', message: 'Student Name released payment', date: '15 Aug. 2021', time: '09:00' },
  ],
  booking: [
    { id: 7, starred: false, read: false, name: 'John Doe', title: 'New Booking', message: 'Lorem Ipsum is simply dummy text of the', date: '15 Aug. 2021', time: '09:00' },
    { id: 8, starred: false, read: true, name: 'John Doe', title: 'Booked', message: 'Session confirmed for next week', date: '15 Aug. 2021', time: '09:00' },
  ],
  teacher: [
    { id: 9, starred: false, read: false, name: 'John Doe', title: 'Waiting For Confirmation (T)', message: 'Lorem Ipsum is simply dummy text of the', date: '15 Aug. 2021', time: '09:00' },
    { id: 10, starred: false, read: true, name: 'John Doe', title: 'Cancelled After Time Policy', message: 'Get fees', date: '15 Aug. 2021', time: '09:00' },
  ],
  student: [
    { id: 11, starred: false, read: false, name: 'John Doe', title: 'Cancelled Before Time Policy (S)', message: 'Sorry to let you know about cancelation', date: '15 Aug. 2021', time: '09:00' },
    { id: 12, starred: false, read: true, name: 'John Doe', title: 'Payment Released', message: 'Student Name released payment', date: '15 Aug. 2021', time: '09:00' },
  ],
  site: [
    { id: 13, starred: false, read: false, name: 'Bready Team', title: 'Welcome', message: 'Welcome to Bready — set up your profile', date: '15 Aug. 2021', time: '09:00' },
    { id: 14, starred: false, read: true, name: 'Bready Team', title: 'Update', message: 'New features are available in your dashboard', date: '15 Aug. 2021', time: '09:00' },
  ],
};

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

function InboxTabPanel({ rows }) {
  const [titleFilters, setTitleFilters] = useState(['Booked', 'Booked']);
  const [studentFilters, setStudentFilters] = useState(['Aman']);
  const [studentSearch, setStudentSearch] = useState('');
  const [titleSearch, setTitleSearch] = useState('');
  const [columnSearch, setColumnSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    Name: true,
    Type: true,
    Date: false,
    Time: false,
    Service: false,
    'Referred Students': false,
    Duration: false,
  });
  const [fromDate, setFromDate] = useState('');
  const [untilDate, setUntilDate] = useState('');
  const [selectedRows, setSelectedRows] = useState({});
  const [starredRows, setStarredRows] = useState(
    rows.reduce((acc, r) => ({ ...acc, [r.id]: !!r.starred }), {})
  );

  const filteredTitleOptions = useMemo(
    () =>
      TITLE_OPTIONS.filter((t) =>
        t.label.toLowerCase().includes(titleSearch.toLowerCase())
      ),
    [titleSearch]
  );

  const filteredColumnOptions = useMemo(
    () =>
      COLUMN_OPTIONS.filter((c) =>
        c.toLowerCase().includes(columnSearch.toLowerCase())
      ),
    [columnSearch]
  );

  const addStudentFilter = (e) => {
    if (e.key === 'Enter' && studentSearch.trim()) {
      setStudentFilters([...studentFilters, studentSearch.trim()]);
      setStudentSearch('');
    }
  };

  return (
    <div className="pt-6">
      {/* Filter By panel */}
      <div className="max-w-md">
        <Card className="p-4 shadow-sm">
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
                  Filter messages by title, student, and date range.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Title dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 bg-white border rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>Title</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="px-4 py-3 border-b">
                <h4 className="font-semibold">Select Title</h4>
              </div>
              <div className="p-3 space-y-3 max-h-72 overflow-auto">
                <Input
                  value={titleSearch}
                  onChange={(e) => setTitleSearch(e.target.value)}
                  placeholder="Search"
                  className="h-9"
                />
                {filteredTitleOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <Checkbox
                      checked={titleFilters.includes(opt.label)}
                      onCheckedChange={(val) => {
                        if (val) setTitleFilters([...titleFilters, opt.label]);
                        else
                          setTitleFilters(
                            titleFilters.filter((l) => l !== opt.label)
                          );
                      }}
                    />
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${opt.color}`}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {titleFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {titleFilters.map((label, i) => (
                <FilterChip
                  key={`${label}-${i}`}
                  label={label}
                  onRemove={() =>
                    setTitleFilters(titleFilters.filter((_, idx) => idx !== i))
                  }
                />
              ))}
            </div>
          )}

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              onKeyDown={addStudentFilter}
              placeholder="Search a student"
              className="pl-9"
            />
          </div>

          {studentFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {studentFilters.map((label, i) => (
                <FilterChip
                  key={`${label}-${i}`}
                  label={label}
                  onRemove={() =>
                    setStudentFilters(
                      studentFilters.filter((_, idx) => idx !== i)
                    )
                  }
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Date range */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col">
          <Label className="text-sm mb-1">From</Label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-44"
          />
        </div>
        <div className="flex flex-col">
          <Label className="text-sm mb-1">Until</Label>
          <Input
            type="date"
            value={untilDate}
            onChange={(e) => setUntilDate(e.target.value)}
            className="w-44"
          />
        </div>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          Show
        </Button>
      </div>

      {/* Bulk action row */}
      <div className="mt-10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded bg-white">
            <label className="px-2 py-1.5 flex items-center">
              <Checkbox
                checked={
                  rows.length > 0 &&
                  rows.every((r) => selectedRows[r.id])
                }
                onCheckedChange={(val) => {
                  if (val) {
                    const all = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setSelectedRows(all);
                  } else {
                    setSelectedRows({});
                  }
                }}
              />
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="px-2 py-1.5 border-l text-gray-500 hover:bg-gray-50"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-40 p-1">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
                  onClick={() => {
                    const all = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setSelectedRows(all);
                  }}
                >
                  Everything
                </button>
              </PopoverContent>
            </Popover>
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white border rounded px-3 py-1.5">
          <span className="text-sm text-gray-600">1 – 20 of 100</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <List className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <div className="px-4 py-3 border-b">
                <h4 className="font-semibold">Column</h4>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Default option
                  </h3>
                  <Input
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search"
                    className="h-9"
                  />
                </div>
                {filteredColumnOptions.map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                  >
                    <Checkbox
                      checked={!!visibleColumns[col]}
                      onCheckedChange={(val) =>
                        setVisibleColumns({ ...visibleColumns, [col]: !!val })
                      }
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="h-8">
            Extract CSV File
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            <Download className="w-4 h-4 mr-2" />
            Statement
          </Button>
        </div>
      </div>

      {/* Messages table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full bg-white border text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-gray-600">
              <th className="p-3 w-10"></th>
              <th className="p-3 w-10"></th>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Title</th>
              <th className="p-3 font-semibold">Message</th>
              <th className="p-3 font-semibold whitespace-nowrap">
                Message Date
              </th>
              <th className="p-3 font-semibold whitespace-nowrap">
                Message Time
              </th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const unread = !row.read;
              const rowWeight = unread ? 'font-bold' : 'font-normal';
              return (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <Checkbox
                      checked={!!selectedRows[row.id]}
                      onCheckedChange={(val) =>
                        setSelectedRows({ ...selectedRows, [row.id]: !!val })
                      }
                    />
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() =>
                        setStarredRows({
                          ...starredRows,
                          [row.id]: !starredRows[row.id],
                        })
                      }
                      className="text-gray-400 hover:text-amber-400"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          starredRows[row.id]
                            ? 'fill-amber-400 text-amber-400'
                            : ''
                        }`}
                      />
                    </button>
                  </td>
                  <td className={`p-3 ${rowWeight}`}>
                    <Link
                      to={`${createPageUrl('TeacherInboxDetail')}?id=${row.id}`}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {row.name}
                    </Link>
                  </td>
                  <td className={`p-3 ${rowWeight}`}>
                    <Link
                      to={`${createPageUrl('TeacherInboxDetail')}?id=${row.id}`}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className={`p-3 ${rowWeight}`}>
                    <Link
                      to={`${createPageUrl('TeacherInboxDetail')}?id=${row.id}`}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {row.message}
                    </Link>
                  </td>
                  <td className={`p-3 whitespace-nowrap ${rowWeight}`}>
                    <Link
                      to={`${createPageUrl('TeacherInboxDetail')}?id=${row.id}`}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {row.date}
                    </Link>
                  </td>
                  <td className={`p-3 whitespace-nowrap ${rowWeight}`}>
                    <Link
                      to={`${createPageUrl('TeacherInboxDetail')}?id=${row.id}`}
                      className="text-gray-900 hover:text-blue-600"
                    >
                      {row.time}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TeacherInbox() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

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
          <p className="text-gray-600">Loading your inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Inbox</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Inbox</span>
          </nav>
        </div>
      </div>

      {/* Teacher action nav */}
      <TeacherPageTabs activeTabValue="inbox" />

      <div className="container mx-auto px-4 md:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {t.label}
                  {t.badge ? (
                    <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                      {t.badge}
                    </Badge>
                  ) : null}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((t) => (
            <TabsContent key={t.value} value={t.value} className="mt-0">
              <InboxTabPanel rows={SAMPLE_ROWS[t.value]} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
