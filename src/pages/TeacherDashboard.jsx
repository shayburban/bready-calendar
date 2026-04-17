import React, { useState, useEffect } from 'react';
import { User, Booking, TeacherProfile, Review, Availability, StudentRequest } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusStyles = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-200 text-gray-600',
  open: 'bg-purple-100 text-purple-700',
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function TeacherDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [studentNames, setStudentNames] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const currentUser = await User.me();
        setUser(currentUser);

        const [myBookings, profiles, myAvail, myReviews, openReqs, allStudents] = await Promise.all([
          Booking.filter({ teacher_id: currentUser.id }),
          TeacherProfile.filter({ user_id: currentUser.id }),
          Availability.filter({ teacher_id: currentUser.id }),
          Review.filter({ teacher_id: currentUser.id }),
          StudentRequest.filter({ status: 'open' }),
          User.list(),
        ]);
        setProfile(profiles[0] || null);
        setBookings(myBookings);
        setAvailability(myAvail);
        setReviews(myReviews);
        setRequests(openReqs);

        const nameMap = {};
        allStudents.forEach((u) => {
          nameMap[u.id] = u.full_name;
        });
        setStudentNames(nameMap);
      } catch (e) {
        console.error('TeacherDashboard load failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const past = bookings.filter((b) => b.status === 'completed');
  const pending = bookings.filter((b) => b.status === 'pending');

  const monthEarnings = past
    .filter((b) => {
      const d = new Date(b.start_time);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const totalEarnings = past.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const avgRating =
    reviews.length === 0
      ? 0
      : (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1);
  const uniqueStudents = new Set(bookings.map((b) => b.student_id)).size;

  const matchingRequests = profile
    ? requests.filter((r) =>
        (profile.subjects || []).some((s) => s.toLowerCase() === (r.subject || '').toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Teacher Dashboard'}
          </h1>
          <p className="opacity-80">
            {profile
              ? `${(profile.subjects || []).join(' · ')}  ·  ${profile.location}`
              : 'Manage your schedule, students, and earnings.'}
          </p>
          <nav className="text-sm opacity-80 mt-2">
            <Link to={createPageUrl('Home')} className="hover:text-blue-200 underline-offset-2 hover:underline">
              Website Homepage
            </Link>
            <span className="mx-2">/</span>
            <span>Dashboard</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={CalendarIcon} color="text-blue-600" label="Upcoming" value={upcoming.length} />
          <StatCard icon={Users} color="text-purple-600" label="Students" value={uniqueStudents} />
          <StatCard icon={Star} color="text-yellow-600" label="Rating" value={avgRating || '—'} />
          <StatCard icon={DollarSign} color="text-green-600" label="This Month" value={`$${monthEarnings}`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <EmptyState message="No upcoming sessions scheduled." ctaLabel="Open calendar" to={createPageUrl('TeacherCalendar')} />
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((b) => (
                    <div key={b.id} className="p-4 border rounded-lg flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {(studentNames[b.student_id] || 'S').charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-semibold text-gray-900">{b.subject}</h4>
                          <Badge className={statusStyles[b.status] || ''}>{b.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">with {studentNames[b.student_id] || 'Student'}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" /> {formatDate(b.start_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> {formatTime(b.start_time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" /> {b.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Weekly Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availability.length === 0 ? (
                <EmptyState
                  message="No availability set yet."
                  ctaLabel="Set availability"
                  to={createPageUrl('TeacherCalendar')}
                />
              ) : (
                <ul className="space-y-2">
                  {availability
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((a) => (
                      <li key={a.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="font-medium text-gray-800">{dayNames[a.day_of_week] || 'Day'}</span>
                        <span className="text-sm text-gray-600">
                          {a.start_time} – {a.end_time}
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Earnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lifetime</span>
                <span className="font-semibold">${totalEarnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">This month</span>
                <span className="font-semibold">${monthEarnings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending approvals</span>
                <Badge className={statusStyles.pending}>{pending.length}</Badge>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to={createPageUrl('TeacherFinance')}>View finance</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Matching Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchingRequests.length === 0 ? (
                <p className="text-sm text-gray-500">No open requests match your subjects right now.</p>
              ) : (
                <div className="space-y-3">
                  {matchingRequests.slice(0, 4).map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{r.subject}</h4>
                        <Badge className={statusStyles[r.status] || ''}>{r.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {r.level} · ${r.budget}/hr · {studentNames[r.student_id] || 'Student'}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{r.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Recent Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {studentNames[r.student_id] || 'Student'}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {profile && !profile.is_approved && (
          <Card className="border-yellow-300 bg-yellow-50">
            <CardContent className="pt-6 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-yellow-600" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900">Profile under review</h4>
                <p className="text-sm text-yellow-800">
                  Your teaching profile is awaiting admin approval. We'll notify you once it goes live.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, ctaLabel, to }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-gray-500 mb-3">{message}</p>
      {ctaLabel && to && (
        <Button asChild size="sm">
          <Link to={to}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
