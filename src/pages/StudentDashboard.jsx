import React, { useState, useEffect } from 'react';
import { User, Booking, TeacherProfile, Review, StudentRequest, SearchQuery } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  Users,
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

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

export default function StudentDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const currentUser = await User.me();
        setUser(currentUser);

        const [myBookings, allTeachers, myReviews, myRequests, mySearches] = await Promise.all([
          Booking.filter({ student_id: currentUser.id }),
          TeacherProfile.list(),
          Review.filter({ student_id: currentUser.id }),
          StudentRequest.filter({ student_id: currentUser.id }),
          SearchQuery.filter({ user_id: currentUser.id }),
        ]);
        setBookings(myBookings);
        setTeachers(allTeachers.filter((t) => t.is_approved));
        setReviews(myReviews);
        setRequests(myRequests);
        setSearches(mySearches);
      } catch (e) {
        console.error('StudentDashboard load failed', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const teacherById = (id) => teachers.find((t) => t.user_id === id);

  const upcoming = bookings
    .filter((b) => b.status !== 'cancelled' && new Date(b.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const past = bookings
    .filter((b) => b.status === 'completed' || new Date(b.start_time) < new Date())
    .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const totalSpent = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  const uniqueTeachers = new Set(bookings.map((b) => b.teacher_id)).size;

  const recommended = teachers
    .filter((t) => !bookings.some((b) => b.teacher_id === t.user_id))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3);

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
            {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Student Dashboard'}
          </h1>
          <p className="opacity-80">Track your learning journey, bookings, and progress.</p>
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
          <StatCard icon={BookOpen} color="text-green-600" label="Completed" value={past.filter((b) => b.status === 'completed').length} />
          <StatCard icon={Users} color="text-purple-600" label="Tutors" value={uniqueTeachers} />
          <StatCard icon={DollarSign} color="text-orange-600" label="Invested" value={`$${totalSpent}`} />
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
                <EmptyState
                  message="No upcoming sessions yet."
                  ctaLabel="Find a tutor"
                  to={createPageUrl('FindTutors')}
                />
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((b) => {
                    const t = teacherById(b.teacher_id);
                    return (
                      <div key={b.id} className="p-4 border rounded-lg flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                          {(t?.full_name || 'T').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="font-semibold text-gray-900">{b.subject}</h4>
                            <Badge className={statusStyles[b.status] || ''}>{b.status}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">with {t?.full_name || 'Teacher'}</p>
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Recommended Tutors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommended.length === 0 ? (
                <p className="text-sm text-gray-500">You're connected with all available tutors.</p>
              ) : (
                <div className="space-y-3">
                  {recommended.map((t) => (
                    <div key={t.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{t.full_name}</h4>
                        <span className="flex items-center gap-1 text-sm text-yellow-600">
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          {t.rating}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{(t.subjects || []).join(', ')}</p>
                      <p className="text-xs text-gray-500">{t.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold">${t.hourly_rate}/hr</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={createPageUrl('BookingCalendar')}>Book</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {past.length === 0 ? (
                <p className="text-sm text-gray-500">No past sessions.</p>
              ) : (
                <div className="space-y-2">
                  {past.slice(0, 5).map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{b.subject}</p>
                        <p className="text-xs text-gray-500">{formatDate(b.start_time)}</p>
                      </div>
                      <Badge className={statusStyles[b.status] || ''}>{b.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                My Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <EmptyState message="No open requests." ctaLabel="Post a requirement" to={createPageUrl('PostRequirement')} />
              ) : (
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">{r.subject}</h4>
                        <Badge className={statusStyles[r.status] || ''}>{r.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{r.level} · ${r.budget}/hr</p>
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
                <Search className="w-5 h-5" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searches.length === 0 ? (
                <p className="text-sm text-gray-500">No searches yet.</p>
              ) : (
                <ul className="space-y-2">
                  {searches.slice(0, 5).map((s) => (
                    <li key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{s.query}</span>
                      <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                        {s.result_count} results
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {reviews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Reviews You've Written
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews.map((r) => {
                  const t = teacherById(r.teacher_id);
                  return (
                    <div key={r.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{t?.full_name || 'Teacher'}</span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          ))}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                    </div>
                  );
                })}
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
