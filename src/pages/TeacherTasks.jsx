import React, { useState, useEffect, useMemo } from 'react';
import { User } from '@/api/entities';
import { TITLE_OPTIONS } from '@/data/teacherTasks';
import { useTeacherTasksData } from '@/data/useTeacherTasksData';
import { mapRecordsToTaskRows } from '@/data/taskRowMapping';
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
  Info,
  Search,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  List,
  Download,
  ChevronDown,
  MessageSquare,
  Mail,
  Send,
  Bell,
  MoreVertical,
  CreditCard,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const COLUMN_OPTIONS = [
  'Name',
  'Type',
  'Date',
  'Time',
  'Service',
  'Referred Students',
  'Duration',
];

// Outer perspective tabs. Unified label/order with the sidebar twin (Spec F).
const OUTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'teacher', label: 'As A Teacher' },
  { value: 'student', label: 'As A Student' },
];

// Columns the live `bookings` table doesn't back -> '—' in live, real in demo
// (Spec F). Money Deposited is NEVER computed from bookings.
const UNBACKED_IN_LIVE = new Set(['Service', 'Referred Students', 'Money Deposited']);

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

// Controlled filter card — student + task-type chips now actually filter (Spec G).
function TaskFilterPanel({
  titleFilters,
  setTitleFilters,
  studentFilters,
  setStudentFilters,
}) {
  const [studentSearch, setStudentSearch] = useState('');
  const [titleSearch, setTitleSearch] = useState('');

  const filteredTitleOptions = useMemo(
    () =>
      TITLE_OPTIONS.filter((t) =>
        t.label.toLowerCase().includes(titleSearch.toLowerCase())
      ),
    [titleSearch]
  );

  const addStudentFilter = (e) => {
    if (e.key === 'Enter' && studentSearch.trim()) {
      setStudentFilters([...studentFilters, studentSearch.trim()]);
      setStudentSearch('');
    }
  };

  return (
    <div className="max-w-md pt-6">
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
                Filter tasks by title, student, and date range.
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
              <span>Select Task</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="px-4 py-3 border-b">
              <h4 className="font-semibold">Select Task</h4>
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
  );
}

// A button that's disabled until its feature ships, with a visible reason
// (Spec A/G — never a silent dead control).
function ComingSoon({ children, label }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent>{label || 'Coming soon'}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TaskTable({ rows, visibleColumns, setVisibleColumns, live, fromDate, untilDate, setFromDate, setUntilDate, onApplyRange }) {
  const [columnSearch, setColumnSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState({});

  const filteredColumnOptions = useMemo(
    () =>
      COLUMN_OPTIONS.filter((c) =>
        c.toLowerCase().includes(columnSearch.toLowerCase())
      ),
    [columnSearch]
  );

  const show = (k) => !!visibleColumns[k];
  // value of an unbacked column: real in demo (per row), '—' in live.
  const cell = (row, colKey, real) => (!row.isDemo && UNBACKED_IN_LIVE.has(colKey) ? '—' : real);

  return (
    <div>
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
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={onApplyRange}>
          Show
        </Button>
      </div>

      {/* Bulk action row */}
      <div className="mt-10 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded bg-white">
            <label className="px-2 py-1.5 flex items-center">
              <Checkbox
                checked={rows.length > 0 && rows.every((r) => selectedRows[r.id])}
                onCheckedChange={(val) => {
                  if (val) {
                    const all = {};
                    rows.forEach((r) => (all[r.id] = true));
                    setSelectedRows(all);
                  } else {
                    setSelectedRows({});
                  }
                }}
                aria-label="Select all rows"
              />
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="px-2 py-1.5 border-l text-gray-500 hover:bg-gray-50"
                  aria-label="Selection options"
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
          <ComingSoon label="Bulk cancel — coming soon">
            <Button variant="outline" size="sm" className="h-9" disabled aria-label="Bulk cancel selected">
              <Trash2 className="w-4 h-4" />
            </Button>
          </ComingSoon>
        </div>

        <div className="flex items-center gap-2 bg-white border rounded px-3 py-1.5">
          <span className="text-sm text-gray-600">{rows.length} shown</span>
          <ComingSoon label="Pagination — coming soon">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </ComingSoon>
          <ComingSoon label="Pagination — coming soon">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" disabled aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </ComingSoon>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" aria-label="Column settings">
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
                        setVisibleColumns((prev) => ({ ...prev, [col]: !!val }))
                      }
                    />
                    <span>{col}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <ComingSoon label="CSV export — coming soon">
            <Button variant="outline" size="sm" className="h-8" disabled>
              Extract CSV File
            </Button>
          </ComingSoon>
          <ComingSoon label="Statement — coming soon">
            <Button variant="outline" size="sm" className="h-8" disabled>
              <Download className="w-4 h-4 mr-2" />
              Statement
            </Button>
          </ComingSoon>
        </div>
      </div>

      {/* Tasks table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full bg-white border text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-left text-gray-600">
              <th className="p-3 w-10"></th>
              {show('Name') && <th className="p-3 font-semibold">Name</th>}
              {show('Type') && <th className="p-3 font-semibold">Type</th>}
              {show('Date') && <th className="p-3 font-semibold">Date</th>}
              {show('Time') && <th className="p-3 font-semibold">Time</th>}
              {show('Service') && <th className="p-3 font-semibold">Service</th>}
              {show('Referred Students') && (
                <th className="p-3 font-semibold whitespace-nowrap">Referred Student</th>
              )}
              {show('Duration') && <th className="p-3 font-semibold">Duration</th>}
              <th className="p-3 font-semibold whitespace-nowrap">Price per Hour</th>
              <th className="p-3 font-semibold">Total Cost</th>
              <th className="p-3 font-semibold whitespace-nowrap">Money Deposited</th>
              <th className="p-3 font-semibold">Contact</th>
              <th className="p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Checkbox
                    checked={!!selectedRows[row.id]}
                    onCheckedChange={(val) =>
                      setSelectedRows({ ...selectedRows, [row.id]: !!val })
                    }
                    aria-label={`Select ${row.name}`}
                  />
                </td>
                {show('Name') && (
                  <td className="p-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      {row.name}
                      {row.isDemo && (
                        <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-violet-600 text-white">
                          DEMO
                        </span>
                      )}
                    </span>
                  </td>
                )}
                {show('Type') && (
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap">
                      <span className={`inline-block w-3 h-3 rounded-full ${row.typeColor}`} />
                      {row.type}
                    </span>
                  </td>
                )}
                {show('Date') && <td className="p-3 whitespace-nowrap">{row.date}</td>}
                {show('Time') && <td className="p-3 whitespace-nowrap">{row.time}</td>}
                {show('Service') && (
                  <td className="p-3 whitespace-nowrap">{cell(row, 'Service', row.service || '—')}</td>
                )}
                {show('Referred Students') && (
                  <td className="p-3">
                    {!row.isDemo ? (
                      '—'
                    ) : row.referred ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </td>
                )}
                {show('Duration') && <td className="p-3 whitespace-nowrap">{row.duration}</td>}
                <td className="p-3 whitespace-nowrap">{row.rate}</td>
                <td className="p-3 whitespace-nowrap">{row.total}</td>
                <td className="p-3">
                  {!row.isDemo ? (
                    <span className="text-gray-400" title="Not derivable from bookings (payments/escrow)">—</span>
                  ) : (
                    <CreditCard className={`w-5 h-5 ${row.deposited ? 'text-blue-600' : 'text-gray-400'}`} />
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {[
                      { Icon: MessageSquare, label: 'Message' },
                      { Icon: Mail, label: 'Email' },
                      { Icon: Send, label: 'Send' },
                      { Icon: Bell, label: 'Remind' },
                      { Icon: MoreVertical, label: 'More' },
                    ].map(({ Icon, label }) => (
                      <ComingSoon key={label} label={`${label} — coming soon`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled aria-label={label}>
                          <Icon className="w-4 h-4" />
                        </Button>
                      </ComingSoon>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <ComingSoon label="Cancel goes live in Phase 2">
                      <Button variant="outline" size="sm" className="h-8" disabled>
                        Cancel
                      </Button>
                    </ComingSoon>
                    <ComingSoon label="Reschedule goes live in Phase 2">
                      <Button variant="outline" size="sm" className="h-8" disabled>
                        Reschedule
                      </Button>
                    </ComingSoon>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-gray-500">
                  No tasks match the current view and filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskTabPanel({
  rows,
  innerTab,
  setInnerTab,
  titleFilters,
  setTitleFilters,
  studentFilters,
  setStudentFilters,
  visibleColumns,
  setVisibleColumns,
  live,
  fromDate,
  untilDate,
  setFromDate,
  setUntilDate,
  onApplyRange,
}) {
  return (
    <div className="pt-6">
      <TaskFilterPanel
        titleFilters={titleFilters}
        setTitleFilters={setTitleFilters}
        studentFilters={studentFilters}
        setStudentFilters={setStudentFilters}
      />

      <Tabs value={innerTab} onValueChange={setInnerTab} className="mt-6">
        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
          <TabsTrigger
            value="todo"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            To Do
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
          >
            Done
          </TabsTrigger>
        </TabsList>

        <TabsContent value={innerTab} className="mt-0">
          <TaskTable
            rows={rows}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            live={live}
            fromDate={fromDate}
            untilDate={untilDate}
            setFromDate={setFromDate}
            setUntilDate={setUntilDate}
            onApplyRange={onApplyRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TeacherTasks() {
  const [user, setUser] = useState(null); // eslint-disable-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [innerTab, setInnerTab] = useState('todo');
  const [demoMode, setDemoMode] = useState(false);

  const { records, loading: dataLoading, mode } = useTeacherTasksData({
    source: demoMode ? 'demo' : undefined,
  });
  const isDemoView = mode === 'demo' || mode === 'live-unavailable';

  // Lifted filter state (drives the rows).
  const [titleFilters, setTitleFilters] = useState([]);
  const [studentFilters, setStudentFilters] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [untilDate, setUntilDate] = useState('');
  const [appliedRange, setAppliedRange] = useState({ from: '', until: '' });
  const [visibleColumns, setVisibleColumns] = useState({
    Name: true,
    Type: true,
    Date: false,
    Time: false,
    Service: false,
    'Referred Students': false,
    Duration: false,
  });
  const allRows = useMemo(() => mapRecordsToTaskRows(records, { nowMs: Date.now() }), [records]);

  const rows = useMemo(() => {
    let out = allRows;
    if (activeTab === 'teacher') out = out.filter((r) => r.perspective === 'T');
    else if (activeTab === 'student') out = out.filter((r) => r.perspective === 'S');
    out = out.filter((r) => r.bucket === innerTab);
    if (studentFilters.length) {
      const needles = studentFilters.map((s) => s.toLowerCase());
      out = out.filter((r) => needles.some((n) => String(r.name).toLowerCase().includes(n)));
    }
    if (titleFilters.length) {
      const needles = titleFilters.map((s) => s.toLowerCase());
      out = out.filter((r) => needles.some((n) => r.type.toLowerCase().includes(n)));
    }
    const rowISO = (r) => (r.record?.startUTC ? r.record.startUTC.slice(0, 10) : null);
    if (appliedRange.from) out = out.filter((r) => rowISO(r) && rowISO(r) >= appliedRange.from);
    if (appliedRange.until) out = out.filter((r) => rowISO(r) && rowISO(r) <= appliedRange.until);
    return out;
  }, [allRows, activeTab, innerTab, studentFilters, titleFilters, appliedRange]);

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
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">Teacher Task Manager</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Teacher Task Manager</span>
          </nav>
        </div>
      </div>

      <TeacherPageTabs activeTabValue="tasks" />

      {/* Demo / live-unavailable banners — keyed off the resolved mode; a colour
          deliberately distinct from the orange admin banner (Spec I). */}
      {mode === 'demo' && (
        <div className="bg-violet-600 text-white text-sm font-semibold px-4 py-2 text-center">
          ⚠️ DEMO DATA — sample bookings for testing. Nothing here is real and no changes are saved.
        </div>
      )}
      {mode === 'live-unavailable' && (
        <div className="bg-rose-700 text-white text-sm font-semibold px-4 py-2 text-center">
          ⚠️ Live data unavailable — showing DEMO data. Nothing here is real.
        </div>
      )}

      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
              {OUTER_TABS.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border text-gray-700 rounded-full px-4 py-2 text-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {/* Dev-only source toggle (Spec I): ON -> demo; OFF -> live (Supabase). */}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <Checkbox checked={demoMode} onCheckedChange={(v) => setDemoMode(!!v)} aria-label="Toggle demo data" />
            <span>Demo data</span>
          </label>
        </div>

        {dataLoading ? (
          <TasksSkeleton />
        ) : allRows.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No bookings yet. When you teach or book a lesson, it will appear here.
          </Card>
        ) : (
          <TaskTabPanel
            rows={rows}
            innerTab={innerTab}
            setInnerTab={setInnerTab}
            titleFilters={titleFilters}
            setTitleFilters={setTitleFilters}
            studentFilters={studentFilters}
            setStudentFilters={setStudentFilters}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            live={!isDemoView}
            fromDate={fromDate}
            untilDate={untilDate}
            setFromDate={setFromDate}
            setUntilDate={setUntilDate}
            onApplyRange={() => setAppliedRange({ from: fromDate, until: untilDate })}
          />
        )}
      </div>
    </div>
  );
}

function TasksSkeleton() {
  return (
    <div className="pt-6 space-y-3" aria-busy="true">
      <div className="h-40 max-w-md bg-gray-100 rounded animate-pulse" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
      ))}
    </div>
  );
}
