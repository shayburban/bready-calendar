
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import TeacherPageTabs from '../components/common/TeacherPageTabs';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TeacherInbox() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const notifications = [
    { id: 1, type: 'booking', title: 'New Booking Request', message: 'Sarah M. wants to book a session for Mathematics', time: '2 hours ago', read: false },
    { id: 2, type: 'payment', title: 'Payment Received', message: 'You received $50 for session with John D.', time: '1 day ago', read: false },
    { id: 3, type: 'reminder', title: 'Upcoming Session', message: 'You have a session with Alice K. in 30 minutes', time: '3 hours ago', read: true },
    { id: 4, type: 'system', title: 'Profile Updated', message: 'Your teaching profile has been successfully updated', time: '2 days ago', read: true },
  ];

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
            <span>Inbox</span>
          </nav>
        </div>
      </div>

      {/* Navigation Tabs */}
      <TeacherPageTabs activeTabValue="inbox" />

      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications & Messages
              <Badge className="bg-red-500">2 New</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border rounded-lg flex items-start gap-3 ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="mt-1">
                    {notification.type === 'booking' && <AlertCircle className="w-5 h-5 text-orange-500" />}
                    {notification.type === 'payment' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {notification.type === 'reminder' && <Clock className="w-5 h-5 text-blue-500" />}
                    {notification.type === 'system' && <Bell className="w-5 h-5 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-sm text-gray-400 mt-2">{notification.time}</p>
                  </div>
                  {!notification.read && (
                    <Button size="sm" variant="outline">
                      Mark Read
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
