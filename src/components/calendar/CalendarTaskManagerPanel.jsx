import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import FieldInput from '@/components/common/FieldInput';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
// Task 1 — single source of truth for sidebar checkbox styling
// (see the shared module for the saikat-anchored rationale).
import { SIDEBAR_CHECKBOX_CLASS } from '@/components/common/sidebarCheckboxClass';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Info,
  ChevronDown,
  X,
  Pencil,
  Trash2,
  Mail,
  MoreVertical,
  CreditCard,
  Video,
  UserX,
  Copy,
  Send,
  Search,
  Check,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { TITLE_OPTIONS } from '@/data/teacherTasks';
import { useTeacherTasksData } from '@/data/useTeacherTasksData';
import { mapRecordsToTaskRows } from '@/data/taskRowMapping';

// Perspective options — unified label/order with the TeacherTasks page (Spec F).
const PERSPECTIVES = [
  { value: 'all', label: 'All' },
  { value: 'teacher', label: 'As A Teacher' },
  { value: 'student', label: 'As A Student' },
];

function FilterChip({ label, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border rounded text-xs text-gray-700">
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

// Disabled control with a visible reason (Spec A/G — no silent dead controls).
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

function TaskCard({ row, onCancel, onSaveSubject, onAnswer }) {
  const typeColor = row.typeColor || 'bg-green-500';
  const [subject, setSubject] = useState(row.subject || '');
  // Keep the input in sync if the underlying row's subject changes (e.g. refetch).
  React.useEffect(() => {
    setSubject(row.subject || '');
  }, [row.subject]);

  const myRole = row.perspective === 'T' ? 'teacher' : 'student';
  const pendingFromOther = row.reschedule && row.rescheduleProposedBy && row.rescheduleProposedBy !== myRole;
  const canCancel = ['booked', 'waiting'].includes(row.typeKey);

  const handleSubjectBlur = () => {
    if (subject !== (row.subject || '')) onSaveSubject(row.id, subject);
  };

  return (
    <div className="bg-white border rounded p-2 mb-3 text-sm">
      <div className="flex justify-end gap-1 mb-1">
        <ComingSoon label="Edit goes live later">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled aria-label="Edit task">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </ComingSoon>
        {canCancel ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Cancel booking"
            title="Cancel booking"
            onClick={() => onCancel(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <ComingSoon label="This booking can no longer be cancelled">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled aria-label="Cancel booking">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </ComingSoon>
        )}
        <ComingSoon label="Email goes live later">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled aria-label="Email">
            <Mail className="w-3.5 h-3.5" />
          </Button>
        </ComingSoon>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="More actions">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <UserX className="w-4 h-4 mr-2" /> Meeting didn&rsquo;t happen
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Copy className="w-4 h-4 mr-2" /> Duplicate meeting
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Video className="w-4 h-4 mr-2" /> Google meeting link
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Video className="w-4 h-4 mr-2" /> Zoom meeting link
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <Send className="w-4 h-4 mr-2" /> Send Reminder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${typeColor}`} />
        <span>{row.name}</span>
        {row.isDemo && (
          <span className="text-[9px] font-bold tracking-wide px-1 py-0.5 rounded bg-violet-600 text-white">
            DEMO
          </span>
        )}
      </p>
      <p className="text-gray-700">
        {row.time}&nbsp;&nbsp;&nbsp;{row.date}
      </p>
      <p className="text-gray-700">
        {row.rate} ({row.rate} * {row.duration} = {row.total})
      </p>

      <p className="font-semibold mt-2 mb-1">
        Meeting subject reminder ({row.perspective || 'T'})
      </p>
      <FieldInput
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={handleSubjectBlur}
        placeholder="Subject reminder"
        className="h-8 mb-2"
      />

      {pendingFromOther && (
        <div className="rounded bg-amber-50 border border-amber-200 p-2 mb-2">
          <p className="text-xs text-amber-800">
            Reschedule proposed{row.rescheduleProposedUTC ? ` → ${row.rescheduleProposedUTC.slice(0, 16).replace('T', ' ')} UTC` : ''}.
          </p>
          <div className="flex gap-2 mt-1">
            <Button variant="outline" size="sm" className="h-7" onClick={() => onAnswer(row, 'decline')}>
              <X className="w-3.5 h-3.5 mr-1" /> Decline
            </Button>
            <Button
              size="sm"
              className="h-7 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onAnswer(row, 'accept')}
            >
              <Check className="w-3.5 h-3.5 mr-1" /> Accept
            </Button>
          </div>
        </div>
      )}

      <p className="flex items-center text-xs mb-1">
        <CreditCard
          className={`w-3.5 h-3.5 mr-2 ${
            row.isDemo && row.deposited ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
        {!row.isDemo
          ? 'Deposit status —'
          : row.deposited
          ? 'Money deposited'
          : 'Money not deposited'}
      </p>

      {row.isDemo && row.oldRate && (
        <p className="text-xs">
          <span className="font-semibold opacity-75">Old Rate:</span> {row.oldRate}
        </p>
      )}
    </div>
  );
}

export default function CalendarTaskManagerPanel() {
  // Same single source the page + calendar + Statistics use (Spec C). Source
  // resolves to live Supabase by default; ?demo=1 / env opt into demo; a live
  // failure falls back to demo with a banner.
  const { records, loading, mode, cancelTask, updateSubject, answerReschedule } = useTeacherTasksData();
  const isDemoView = mode === 'demo' || mode === 'live-unavailable';

  const toastResult = (r, okMsg) =>
    toast(
      r?.ok
        ? { title: r.demo ? `Demo mode: ${okMsg} locally (not saved)` : okMsg }
        : { title: 'Action failed', description: r?.message || 'Please try again.', variant: 'destructive' }
    );
  const handleCancel = async (row) => toastResult(await cancelTask(row.id), 'Booking cancelled');
  const handleSaveSubject = async (id, subject) => toastResult(await updateSubject(id, subject), 'Subject saved');
  const handleAnswer = async (row, action) =>
    toastResult(await answerReschedule(row, action), action === 'accept' ? 'Reschedule accepted' : 'Reschedule declined');

  const [perspective, setPerspective] = useState('all');
  const [innerTab, setInnerTab] = useState('todo');
  const [titleFilters, setTitleFilters] = useState([]);
  const [titleSearch, setTitleSearch] = useState('');
  const [studentFilters, setStudentFilters] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

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

  const perspectiveLabel =
    PERSPECTIVES.find((t) => t.value === perspective)?.label || 'All';

  const allRows = useMemo(
    () => mapRecordsToTaskRows(records, { nowMs: Date.now() }),
    [records]
  );

  const visibleRows = useMemo(() => {
    const roleFilter = perspective === 'teacher' ? 'T' : perspective === 'student' ? 'S' : null;
    let out = allRows.filter((r) => r.bucket === innerTab);
    if (roleFilter) out = out.filter((r) => r.perspective === roleFilter);
    if (studentFilters.length) {
      const needles = studentFilters.map((s) => s.toLowerCase());
      out = out.filter((r) => needles.some((n) => String(r.name).toLowerCase().includes(n)));
    }
    if (titleFilters.length) {
      const needles = titleFilters.map((s) => s.toLowerCase());
      out = out.filter((r) => needles.some((n) => r.type.toLowerCase().includes(n)));
    }
    return out;
  }, [allRows, perspective, innerTab, studentFilters, titleFilters]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-base font-semibold text-[#062a35]">Task Manager</h4>

      {isDemoView && (
        <div className="rounded bg-violet-600 text-white text-xs font-semibold px-2 py-1">
          {mode === 'live-unavailable'
            ? '⚠️ Live data unavailable — showing DEMO data.'
            : '⚠️ DEMO DATA — not real, nothing is saved.'}
        </div>
      )}

      {/* Perspective dropdown (All / As A Teacher / As A Student) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            {perspectiveLabel}
            <ChevronDown className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {PERSPECTIVES.map((t) => (
            <DropdownMenuItem key={t.value} onClick={() => setPerspective(t.value)}>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter by */}
      <div>
        <div className="flex items-center gap-2 mb-2">
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
                Filter tasks by title and student.
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
          <PopoverContent className="w-64 p-0" align="start">
            <div className="px-3 py-2 border-b">
              <h4 className="font-semibold text-sm">Select Task</h4>
            </div>
            <div className="p-2 space-y-2 max-h-64 overflow-auto">
              <FieldInput
                value={titleSearch}
                onChange={(e) => setTitleSearch(e.target.value)}
                placeholder="Search"
                className="h-8"
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
                    // Task 1 — shared sidebar checkbox visual language.
                    className={SIDEBAR_CHECKBOX_CLASS}
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
          <div className="flex flex-wrap gap-2 mt-2">
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
      </div>

      {/* Search a student */}
      <div>
        <Label className="text-sm font-medium text-gray-700">
          Search A Student
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <FieldInput
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            onKeyDown={addStudentFilter}
            placeholder="Search a student"
            className="pl-9 h-9"
          />
        </div>

        {studentFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
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
      </div>

      {/* To Do / Done tabs */}
      <Tabs value={innerTab} onValueChange={setInnerTab}>
        <TabsList className="bg-transparent p-0 h-auto flex gap-2 justify-start">
          <TabsTrigger
            value="todo"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-1.5 text-sm"
          >
            To Do
          </TabsTrigger>
          <TabsTrigger
            value="done"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 bg-white border text-gray-700 rounded-full px-4 py-1.5 text-sm"
          >
            Done
          </TabsTrigger>
        </TabsList>

        <TabsContent value={innerTab} className="mt-3">
          {loading ? (
            <div className="space-y-3" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : visibleRows.length === 0 ? (
            <p className="text-sm text-gray-500">
              {innerTab === 'todo' ? 'No tasks to do.' : 'Nothing done yet.'}
            </p>
          ) : (
            visibleRows.map((row) => (
              <TaskCard
                key={row.id}
                row={row}
                onCancel={handleCancel}
                onSaveSubject={handleSaveSubject}
                onAnswer={handleAnswer}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Link to={createPageUrl('TeacherTasks')}>
        <Button
          variant="outline"
          className="w-full border-green-600 text-green-600 hover:bg-green-50 mt-2"
        >
          View All
        </Button>
      </Link>
    </div>
  );
}
