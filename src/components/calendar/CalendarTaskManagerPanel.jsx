import React, { useState, useMemo, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
} from 'lucide-react';
import {
  TITLE_OPTIONS,
  OUTER_TABS,
  TODO_ROWS,
  DONE_ROWS,
  subscribeTeacherTasks,
  getTeacherTasksVersion,
  updateTeacherTask,
  deleteTeacherTask,
} from '@/data/teacherTasks';

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

function TaskCard({ row }) {
  const [subject, setSubject] = useState(row.subject || '');

  const handleSubjectBlur = () => {
    if (subject !== row.subject) {
      updateTeacherTask(row.id, { subject });
    }
  };

  const typeColor = row.typeColor || 'bg-green-500';

  return (
    <div className="bg-white border rounded p-2 mb-3 text-sm">
      <div className="flex justify-end gap-1 mb-1">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => deleteTeacherTask(row.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Mail className="w-3.5 h-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <UserX className="w-4 h-4 mr-2" /> Meeting didn&rsquo;t happen
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" /> Duplicate meeting
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Video className="w-4 h-4 mr-2" /> Google meeting link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Video className="w-4 h-4 mr-2" /> Zoom meeting link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="w-4 h-4 mr-2" /> Send Reminder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${typeColor}`} />
        <span>{row.name}</span>
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
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        onBlur={handleSubjectBlur}
        placeholder="Subject reminder"
        className="h-8 mb-2"
      />

      <p className="flex items-center text-xs mb-1">
        <CreditCard
          className={`w-3.5 h-3.5 mr-2 ${
            row.deposited ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
        {row.deposited ? 'Money deposited' : 'Money not deposited'}
      </p>

      <p className="text-xs mb-0.5">
        <span className="font-semibold opacity-75">Online Classes:</span> 10 $ for 1 Hr.
      </p>
      <p className="text-xs mb-0.5">
        <span className="font-semibold opacity-75">Consulting:</span> 10 $ for 1 Hr.
      </p>
      <p className="text-xs mb-0.5">
        <span className="font-semibold opacity-75">Technical Interview:</span> 10 $ for 1 Hr.
      </p>
      {row.oldRate && (
        <p className="text-xs">
          <span className="font-semibold opacity-75">Old Rate:</span> {row.oldRate}
        </p>
      )}
    </div>
  );
}

export default function CalendarTaskManagerPanel() {
  // Subscribe to the shared teacher-tasks "database" so edits made here
  // (or in TeacherTasks.jsx) trigger a re-render.
  useSyncExternalStore(subscribeTeacherTasks, getTeacherTasksVersion, getTeacherTasksVersion);

  const [perspective, setPerspective] = useState('all');
  const [innerTab, setInnerTab] = useState('todo');
  const [titleFilters, setTitleFilters] = useState(['Booked', 'Booked']);
  const [titleSearch, setTitleSearch] = useState('');
  const [studentFilters, setStudentFilters] = useState(['Aman']);
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
    OUTER_TABS.find((t) => t.value === perspective)?.label || 'All Tasks';

  const rows = (innerTab === 'todo' ? TODO_ROWS : DONE_ROWS)[perspective] || [];

  const visibleRows = useMemo(() => {
    let out = rows;
    if (studentFilters.length) {
      const needles = studentFilters.map((s) => s.toLowerCase());
      out = out.filter((r) =>
        needles.some((n) => r.name.toLowerCase().includes(n))
      );
    }
    if (titleFilters.length) {
      const needles = titleFilters.map((s) => s.toLowerCase());
      out = out.filter((r) =>
        needles.some((n) => r.type.toLowerCase().includes(n))
      );
    }
    return out;
  }, [rows, studentFilters, titleFilters]);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h4 className="text-base font-semibold text-[#062a35]">Task Manager</h4>

      {/* Perspective dropdown (All Tasks / As A Student (S) / As A Teacher (T)) */}
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
          {OUTER_TABS.map((t) => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setPerspective(t.value)}
            >
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
              <Input
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
          <Input
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

        <TabsContent value="todo" className="mt-3">
          {visibleRows.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks to do.</p>
          ) : (
            visibleRows.map((row) => <TaskCard key={row.id} row={row} />)
          )}
        </TabsContent>
        <TabsContent value="done" className="mt-3">
          {visibleRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nothing done yet.</p>
          ) : (
            visibleRows.map((row) => <TaskCard key={row.id} row={row} />)
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
