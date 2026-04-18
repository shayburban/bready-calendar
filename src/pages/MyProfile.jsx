import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  User as UserIcon,
  Pencil,
  UserPlus,
  Bell,
  Mail,
  RotateCcw,
  X,
  Plus,
  Video,
  MessageCircle,
  Calendar as CalendarIcon,
  Search,
  Star,
  StarHalf,
  Trash2,
  LifeBuoy,
  ChevronDown,
  Circle,
  Filter,
  DollarSign,
  Globe,
  Info,
} from 'lucide-react';
import {
  User,
  Booking,
  TeacherProfile,
  Review,
  StudentRequest,
  Country,
} from '@/api/entities';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DAY_MS = 86400000;

function initialsOf(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return '';
  }
}

function formatShortDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function localTimeFor(tz) {
  if (!tz) return '';
  try {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
    });
  } catch {
    return '';
  }
}

function Stars({ rating = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="inline-flex items-center text-yellow-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} className="w-4 h-4 fill-current" />
      ))}
      {half && <StarHalf className="w-4 h-4 fill-current" />}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </span>
  );
}

function SidebarCard({ title, icon, children, className = '' }) {
  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-4">
        {(title || icon) && (
          <div className="flex items-center gap-2 mb-3">
            {icon}
            <h4 className="font-semibold text-gray-900">{title}</h4>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function NotificationRow({ icon, defaultValue, last = false }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <Select defaultValue={defaultValue}>
        <SelectTrigger className="h-8 flex-1 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Notification</SelectItem>
          <SelectItem value="1h">1 hour before</SelectItem>
          <SelectItem value="2h">2 hours before</SelectItem>
          <SelectItem value="3h">3 hours before</SelectItem>
          <SelectItem value="1d">1 day before</SelectItem>
          <SelectItem value="2d">2 days before</SelectItem>
        </SelectContent>
      </Select>
      {!last && (
        <button
          type="button"
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
          title="Reset"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
      <button
        type="button"
        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        title="Remove"
      >
        <X className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
        title="Add"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function ConnectionRow({ name, subjects = [], extraBadge, rightExtra }) {
  const badgeSubjects = subjects.slice(0, 2).join(', ');
  const more = subjects.length - 2;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
              {initialsOf(name)}
            </AvatarFallback>
          </Avatar>
          <Circle className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            Subjects: {badgeSubjects || '—'}
            {more > 0 && (
              <Badge variant="secondary" className="rounded-full">
                +{more}
              </Badge>
            )}
          </p>
        </div>
      </div>
      {rightExtra && (
        <div className="bg-gray-50 border rounded px-3 py-1.5 text-xs text-gray-700 flex items-center gap-3">
          {rightExtra}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Link
          to={createPageUrl('TeacherChat')}
          className="text-gray-500 hover:text-blue-600"
          title="Chat"
        >
          <MessageCircle className="w-5 h-5" />
        </Link>
        {extraBadge && (
          <span title="Packages with Teacher">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
          </span>
        )}
        <Link
          to={createPageUrl('BookingCalendar')}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          <CalendarIcon className="w-4 h-4" />
          Go To Booking
        </Link>
      </div>
    </div>
  );
}

function QuickActionLinks({ nextBooking, teacherName }) {
  return (
    <div>
      <p className="text-gray-700 mb-3">
        Next lesson:{' '}
        {nextBooking ? (
          <>
            <span className="font-medium">{formatDate(nextBooking.start_time)}</span> at{' '}
            <span className="font-medium">{formatTime(nextBooking.start_time)}</span>{' '}
            with <UserIcon className="inline w-4 h-4 mx-1 text-gray-500" />
            <span className="font-medium">{teacherName}</span>
            <Link
              to={createPageUrl('TeacherChat')}
              className="ml-3 text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-4 h-4" /> Chat With {teacherName}
            </Link>
          </>
        ) : (
          <span className="text-gray-500">No upcoming sessions</span>
        )}
      </p>
      <div className="flex flex-wrap gap-4 text-sm">
        <a href="#" className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600">
          <Video className="w-4 h-4 text-blue-500" /> Skype Call
        </a>
        <a href="#" className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600">
          <Video className="w-4 h-4 text-green-500" /> Google Meet
        </a>
        <a href="#" className="inline-flex items-center gap-2 text-gray-700 hover:text-blue-600">
          <Video className="w-4 h-4 text-sky-500" /> Zoom Meeting
        </a>
      </div>
    </div>
  );
}

function InboxTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-8"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-gray-500 py-6">
                No messages.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <button className="text-gray-400 hover:text-yellow-500">
                    <Star className="w-4 h-4" />
                  </button>
                </TableCell>
                <TableCell>
                  <Link
                    to={createPageUrl('TeacherInbox')}
                    className={`hover:underline ${r.unread ? 'font-semibold' : ''}`}
                  >
                    {r.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    to={createPageUrl('TeacherInbox')}
                    className={`hover:underline ${r.unread ? 'font-semibold' : ''}`}
                  >
                    {r.title}
                  </Link>
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  <Link
                    to={createPageUrl('TeacherInbox')}
                    className={`hover:underline ${r.unread ? 'font-semibold' : ''}`}
                  >
                    {r.message}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                <TableCell className="whitespace-nowrap">{r.time}</TableCell>
                <TableCell>
                  <button className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function InboxToolbar({ total }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        <Checkbox defaultChecked />
        <Button variant="outline" size="sm">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>1 - {Math.min(20, total)} of {total}</span>
        <Button variant="outline" size="sm">
          Extract CSV
        </Button>
        <Button variant="outline" size="sm">
          Statement
        </Button>
      </div>
    </div>
  );
}

export default function MyProfile() {
  const [user, setUser] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [teacherProfiles, setTeacherProfiles] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [sentReviews, setSentReviews] = useState([]);
  const [countries, setCountries] = useState([]);
  const [rateRange, setRateRange] = useState([0, 200]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await User.me();
        if (cancelled) return;
        setUser(me);

        const [
          myProfiles,
          allProfiles,
          users,
          asTeacherBookings,
          asStudentBookings,
          asTeacherReviews,
          asStudentReviews,
          cty,
        ] = await Promise.all([
          TeacherProfile.filter({ user_id: me.id }),
          TeacherProfile.list(),
          User.list(),
          Booking.filter({ teacher_id: me.id }),
          Booking.filter({ student_id: me.id }),
          Review.filter({ teacher_id: me.id }),
          Review.filter({ student_id: me.id }),
          Country.list(),
        ]);

        if (cancelled) return;
        setTeacherProfile(myProfiles?.[0] || null);
        setTeacherProfiles(allProfiles || []);
        setAllUsers(users || []);
        const merged = [...(asTeacherBookings || []), ...(asStudentBookings || [])];
        const uniq = Array.from(new Map(merged.map((b) => [b.id, b])).values());
        setBookings(uniq);
        setReviews(asTeacherReviews || []);
        setSentReviews(asStudentReviews || []);
        setCountries(cty || []);
      } catch (e) {
        console.error('MyProfile load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const country = useMemo(
    () => countries.find((c) => c.country_code === user?.country_code),
    [countries, user]
  );

  const nextBooking = useMemo(() => {
    const now = Date.now();
    return [...bookings]
      .filter((b) => b.status !== 'cancelled' && new Date(b.start_time).getTime() > now)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
  }, [bookings]);

  const nextBookingPeerName = useMemo(() => {
    if (!nextBooking) return '';
    const peerId = nextBooking.teacher_id === user?.id ? nextBooking.student_id : nextBooking.teacher_id;
    return allUsers.find((u) => u.id === peerId)?.full_name || 'Teacher';
  }, [nextBooking, allUsers, user]);

  const inboxRows = useMemo(() => {
    const teacherIdToName = Object.fromEntries(allUsers.map((u) => [u.id, u.full_name]));
    return bookings
      .slice()
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0))
      .map((b, i) => {
        const peerId = b.teacher_id === user?.id ? b.student_id : b.teacher_id;
        const isTeacher = b.teacher_id === user?.id;
        const titleMap = {
          pending: isTeacher ? 'Waiting For Confirmation (T)' : 'Waiting For Confirmation (S)',
          confirmed: isTeacher ? 'Booking Confirmed (T)' : 'Booking Confirmed (S)',
          completed: 'Session Completed',
          cancelled: 'Cancelled',
        };
        return {
          id: b.id,
          name: teacherIdToName[peerId] || 'Unknown',
          title: titleMap[b.status] || b.status,
          message: `${b.subject} session — ${b.status}`,
          date: formatShortDate(b.start_time),
          time: formatTime(b.start_time),
          unread: i < 2,
          kind: isTeacher ? 'teacher' : 'student',
          status: b.status,
        };
      });
  }, [bookings, allUsers, user]);

  const bookingRows = inboxRows.filter((r) => r.status === 'pending' || r.status === 'confirmed');
  const teacherRows = inboxRows.filter((r) => r.kind === 'teacher');
  const studentRows = inboxRows.filter((r) => r.kind === 'student');

  const connections = useMemo(() => {
    const byId = {};
    for (const b of bookings) {
      const peerId = b.teacher_id === user?.id ? b.student_id : b.teacher_id;
      if (!peerId) continue;
      if (!byId[peerId]) {
        const u = allUsers.find((x) => x.id === peerId);
        const profile = teacherProfiles.find((tp) => tp.user_id === peerId);
        byId[peerId] = {
          id: peerId,
          name: u?.full_name || profile?.full_name || 'Unknown',
          subjects: profile?.subjects || [],
          role: u?.role,
          packageHours: 0,
          until: null,
        };
      }
      if (b.status === 'confirmed') byId[peerId].packageHours += 1;
      if (!byId[peerId].until || new Date(b.start_time) > new Date(byId[peerId].until)) {
        byId[peerId].until = b.start_time;
      }
    }
    return Object.values(byId);
  }, [bookings, allUsers, teacherProfiles, user]);

  const savedTeachers = connections.filter((c) => c.role === 'teacher');
  const packageTeachers = savedTeachers.filter((c) => c.packageHours > 0);
  const myStudents = connections.filter((c) => c.role === 'student');
  const packageStudents = myStudents.filter((c) => c.packageHours > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayLocation = teacherProfile?.location || country?.country_name || '—';
  const displayTimezone = country?.timezone || 'UTC';
  const firstName = (user?.full_name || 'there').split(' ')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <nav className="text-sm opacity-80">
            <Link
              to={createPageUrl('Home')}
              className="hover:text-blue-200 transition-colors underline-offset-2 hover:underline"
            >
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>My Profile</span>
          </nav>
        </div>
      </div>

      {/* Teacher page tabs (My Profile active) */}
      <TeacherPageTabs activeTabValue="profile" />

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
            {/* Profile card */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Avatar className="w-20 h-20 mb-3">
                      <AvatarImage src={user?.avatar_url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                        {initialsOf(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-gray-900 text-lg">{user?.full_name}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mt-1">
                      From {country?.country_name || user?.country_code || '—'}
                      <br />
                      Living in {displayLocation}
                      <br />
                      {localTimeFor(displayTimezone)} {displayTimezone.split('/').pop()} time
                    </p>
                  </div>
                  <Link
                    to={createPageUrl('TeacherSettings')}
                    className="p-1.5 text-gray-500 hover:text-blue-600"
                    title="Edit profile"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Refer a New Student */}
            <SidebarCard
              title="Refer a New Student"
              icon={<UserPlus className="w-5 h-5 text-blue-600" />}
            >
              <p className="text-sm text-gray-600">
                For referral options{' '}
                <Link to={createPageUrl('TeacherSettings')} className="text-blue-600 font-semibold hover:underline">
                  click
                </Link>{' '}
                here
              </p>
            </SidebarCard>

            {/* Default Notification */}
            <SidebarCard
              title="Default Notification"
              icon={<Bell className="w-5 h-5 text-amber-500" />}
            >
              <NotificationRow
                icon={<Bell className="w-4 h-4 text-gray-500" />}
                defaultValue="2h"
              />
              <NotificationRow
                icon={<Mail className="w-4 h-4 text-gray-500" />}
                defaultValue="1d"
                last
              />
            </SidebarCard>

            {/* Set Default Filter For Student Post */}
            <SidebarCard title="Default Filter For Student Post">
              <p className="text-sm text-gray-600 mb-3">
                All filters here are by the requirement of a student.
                <br />
                <br />
                To add an alert go to student post.
              </p>
              <div className="flex justify-end">
                <Link
                  to={createPageUrl('PostRequirement')}
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Student Post
                </Link>
              </div>
            </SidebarCard>

            {/* Set Default Filter In Teacher Listing */}
            <SidebarCard title="Default Filter In Teacher Listing">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="speaks">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Teacher Speaks
                      <Badge variant="secondary" className="rounded-full ml-1">
                        2
                      </Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Input placeholder="Type to search..." className="h-8 text-sm" />
                    <div className="flex flex-wrap gap-2 my-3">
                      <Badge variant="outline" className="gap-1">
                        Eng <X className="w-3 h-3" />
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        Fr <X className="w-3 h-3" />
                      </Badge>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {['English', 'French', 'German', 'Spanish', 'Hindi'].map((l) => (
                        <label
                          key={l}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <Checkbox defaultChecked={l === 'English' || l === 'French'} />
                          {l}
                        </label>
                      ))}
                    </div>
                    <div className="text-right mt-3">
                      <Button variant="link" size="sm" className="h-auto px-0">
                        Reset
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="rate">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Hourly Rate
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Select defaultValue="online">
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online Classes</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                        <SelectItem value="interview">Technical Interview</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-700">
                      <span>${rateRange[0]}</span>
                      <span>-</span>
                      <span>${rateRange[1]}</span>
                      <span>USD</span>
                    </div>
                    <Slider
                      value={rateRange}
                      onValueChange={setRateRange}
                      min={0}
                      max={200}
                      step={1}
                      className="mt-3"
                    />
                    <div className="text-right mt-3">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto px-0"
                        onClick={() => setRateRange([0, 200])}
                      >
                        Reset
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cancel">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Cancellation Fees
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-xs text-gray-500 mb-2">Fees percentage</p>
                    <Slider defaultValue={[0, 100]} min={0} max={100} step={1} />
                    <p className="text-xs text-gray-500 mt-4 mb-2">
                      Free Cancellation Before
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">Day</span>
                        <Input className="w-16 h-8 text-center" defaultValue="0" />
                      </div>
                      <span>&amp;</span>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500">Hours</span>
                        <Input className="w-16 h-8 text-center" defaultValue="0" />
                      </div>
                    </div>
                    <div className="text-right mt-3">
                      <Button variant="link" size="sm" className="h-auto px-0">
                        Reset
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarCard>

            {/* Support */}
            <SidebarCard
              title="Support"
              icon={<LifeBuoy className="w-5 h-5 text-green-600" />}
            >
              <p className="text-sm text-gray-600">Go to the support page for help.</p>
              <div className="flex justify-end mt-3">
                <Link
                  to={createPageUrl('TeacherSettings')}
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Support
                </Link>
              </div>
            </SidebarCard>
          </aside>

          {/* RIGHT COLUMN */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Quick actions / next lesson */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="teacher">As A Teacher</TabsTrigger>
                    <TabsTrigger value="student">As A Student</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="pt-4">
                    <QuickActionLinks
                      nextBooking={nextBooking}
                      teacherName={nextBookingPeerName}
                    />
                  </TabsContent>
                  <TabsContent value="teacher" className="pt-4">
                    <QuickActionLinks
                      nextBooking={
                        bookings
                          .filter(
                            (b) =>
                              b.teacher_id === user?.id &&
                              b.status !== 'cancelled' &&
                              new Date(b.start_time).getTime() > Date.now()
                          )
                          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0]
                      }
                      teacherName={nextBookingPeerName}
                    />
                  </TabsContent>
                  <TabsContent value="student" className="pt-4">
                    <QuickActionLinks
                      nextBooking={
                        bookings
                          .filter(
                            (b) =>
                              b.student_id === user?.id &&
                              b.status !== 'cancelled' &&
                              new Date(b.start_time).getTime() > Date.now()
                          )
                          .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0]
                      }
                      teacherName={nextBookingPeerName}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Inbox */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="all">
                      All
                      <Badge className="bg-blue-500 ml-1 rounded-full">{inboxRows.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="bookings">
                      Bookings
                      <Badge className="bg-blue-500 ml-1 rounded-full">{bookingRows.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="teacher">
                      As A Teacher
                      <Badge className="bg-blue-500 ml-1 rounded-full">{teacherRows.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="student">
                      As A Student
                      <Badge className="bg-blue-500 ml-1 rounded-full">{studentRows.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="site">Site Messages</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="pt-4">
                    <InboxToolbar total={inboxRows.length} />
                    <InboxTable rows={inboxRows} />
                  </TabsContent>
                  <TabsContent value="bookings" className="pt-4">
                    <InboxToolbar total={bookingRows.length} />
                    <InboxTable rows={bookingRows} />
                  </TabsContent>
                  <TabsContent value="teacher" className="pt-4">
                    <InboxToolbar total={teacherRows.length} />
                    <InboxTable rows={teacherRows} />
                  </TabsContent>
                  <TabsContent value="student" className="pt-4">
                    <InboxToolbar total={studentRows.length} />
                    <InboxTable rows={studentRows} />
                  </TabsContent>
                  <TabsContent value="site" className="pt-4">
                    <InboxTable rows={[]} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Task Manager */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Task Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Pending sessions and outstanding tasks requiring your attention.
                </p>
                <Tabs defaultValue="upcoming">
                  <TabsList>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upcoming" className="pt-4">
                    <InboxTable
                      rows={inboxRows.filter(
                        (r) => r.status === 'pending' || r.status === 'confirmed'
                      )}
                    />
                  </TabsContent>
                  <TabsContent value="completed" className="pt-4">
                    <InboxTable
                      rows={inboxRows.filter((r) => r.status === 'completed')}
                    />
                  </TabsContent>
                </Tabs>
                <div className="mt-4 text-right">
                  <Link
                    to={createPageUrl('TeacherTasks')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open Task Manager →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* My Connections */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">My Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="teacher">
                  <TabsList>
                    <TabsTrigger value="teacher">As A Teacher</TabsTrigger>
                    <TabsTrigger value="student">As A Student</TabsTrigger>
                  </TabsList>
                  <TabsContent value="teacher" className="pt-4">
                    <details className="mb-3">
                      <summary className="cursor-pointer font-semibold text-gray-700 flex items-center gap-1">
                        <ChevronDown className="w-4 h-4" /> Legend
                      </summary>
                      <ul className="mt-2 text-sm text-gray-600 space-y-1 pl-6">
                        <li className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" /> Message
                        </li>
                        <li className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" /> Packages With Students
                        </li>
                      </ul>
                    </details>
                    <Tabs defaultValue="students">
                      <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="students">My Students</TabsTrigger>
                        <TabsTrigger value="packages">Packages With Students</TabsTrigger>
                      </TabsList>
                      <TabsContent value="students" className="pt-3">
                        {myStudents.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            You don't have any students yet.
                          </p>
                        ) : (
                          myStudents.map((c) => (
                            <ConnectionRow
                              key={c.id}
                              name={c.name}
                              subjects={c.subjects}
                            />
                          ))
                        )}
                      </TabsContent>
                      <TabsContent value="packages" className="pt-3">
                        {packageStudents.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No active packages with students.
                          </p>
                        ) : (
                          packageStudents.map((c) => (
                            <ConnectionRow
                              key={c.id}
                              name={c.name}
                              subjects={c.subjects}
                              extraBadge
                              rightExtra={
                                <>
                                  <span>Package hours left</span>
                                  <Badge variant="secondary" className="rounded-full">
                                    {c.packageHours}
                                  </Badge>
                                  <span>Hr. until {formatShortDate(c.until)}</span>
                                </>
                              }
                            />
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                  <TabsContent value="student" className="pt-4">
                    <Tabs defaultValue="saved">
                      <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="saved">Saved Teachers</TabsTrigger>
                        <TabsTrigger value="packages">Packages With Teachers</TabsTrigger>
                        <TabsTrigger value="mine">My Teachers</TabsTrigger>
                      </TabsList>
                      <TabsContent value="saved" className="pt-3">
                        {savedTeachers.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No saved teachers yet.
                          </p>
                        ) : (
                          savedTeachers.map((c) => (
                            <ConnectionRow
                              key={c.id}
                              name={c.name}
                              subjects={c.subjects}
                            />
                          ))
                        )}
                      </TabsContent>
                      <TabsContent value="packages" className="pt-3">
                        {packageTeachers.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No active packages with teachers.
                          </p>
                        ) : (
                          packageTeachers.map((c) => (
                            <ConnectionRow
                              key={c.id}
                              name={c.name}
                              subjects={c.subjects}
                              extraBadge
                              rightExtra={
                                <>
                                  <span>Package hours left</span>
                                  <Badge variant="secondary" className="rounded-full">
                                    {c.packageHours}
                                  </Badge>
                                  <span>Hr. until {formatShortDate(c.until)}</span>
                                </>
                              }
                            />
                          ))
                        )}
                      </TabsContent>
                      <TabsContent value="mine" className="pt-3">
                        {savedTeachers.length === 0 ? (
                          <p className="text-sm text-gray-500 py-4 text-center">
                            No teachers booked yet.
                          </p>
                        ) : (
                          savedTeachers.map((c) => (
                            <ConnectionRow
                              key={c.id}
                              name={c.name}
                              subjects={c.subjects}
                            />
                          ))
                        )}
                      </TabsContent>
                    </Tabs>
                  </TabsContent>
                </Tabs>
                <div className="mt-5">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Load All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="received">
                  <TabsList>
                    <TabsTrigger value="received">Received As A Teacher</TabsTrigger>
                    <TabsTrigger value="sent">Sent As A Student</TabsTrigger>
                  </TabsList>
                  <TabsContent value="received" className="pt-4 space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        No reviews yet.
                      </p>
                    ) : (
                      reviews.map((r) => {
                        const author = allUsers.find((u) => u.id === r.student_id);
                        return (
                          <div key={r.id} className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {initialsOf(author?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold">
                                  {author?.full_name || 'Student'}
                                </h4>
                                <Stars rating={r.rating} />
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatShortDate(r.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                  <TabsContent value="sent" className="pt-4 space-y-4">
                    {sentReviews.length === 0 ? (
                      <p className="text-sm text-gray-500 py-4 text-center">
                        You haven't left any reviews yet.
                      </p>
                    ) : (
                      sentReviews.map((r) => {
                        const teacher = allUsers.find((u) => u.id === r.teacher_id);
                        return (
                          <div key={r.id} className="flex items-start gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {initialsOf(teacher?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold">
                                  {teacher?.full_name || 'Teacher'}
                                </h4>
                                <Stars rating={r.rating} />
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatShortDate(r.created_date)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
                <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white">
                  Load All
                </Button>
              </CardContent>
            </Card>

            {/* Find A New Teacher */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Find A New Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = new FormData(e.currentTarget).get('q') || '';
                    window.location.href =
                      createPageUrl('FindTutors') + `?query=${encodeURIComponent(q)}`;
                  }}
                  className="flex items-center gap-2 max-w-lg"
                >
                  <Input name="q" placeholder="Search a subject" className="flex-1" />
                  <Button type="submit" variant="outline">
                    <Search className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
